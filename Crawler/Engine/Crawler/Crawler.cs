using MongoDB.Driver;

namespace Crawler;
public class Crawler<TProduct, TOffer> : ICrawler
    where TProduct : BaseProduct
    where TOffer : BaseOffer
{
    private ISelector Selector { get; set; }
    private List<IProcessor<TProduct, TOffer>> Processors { get; set; }
    private List<IProcessor<TProduct, TOffer>> DiscountProcessors { get; set; }
    private IPipeline<TProduct, TOffer> Pipeline { get; set; }
    private IPipeline<TProduct, TOffer> DiscountPipeline { get; set; }
    private IKeyRecordRepository<KeyRecord> OfferCardRepository { get; set; }
    private IKeyRecordRepository<KeyRecord> LinkRepository { get; set; }
    private IReader Reader { get; set; }

    private IComboLogger Logger { get; set; }

    private IPlaywright PlaywrightInstance { get; set; }
    private IBrowser Browser { get; set; }
    private IPage Page { get; set; }
    private string CrawlerPrefix { get; set; }

    private string OfferCardCollection => $"{CrawlerPrefix}_OfferCards";
    private string LinkCollection => $"{CrawlerPrefix}_Links";
    private string ProductCollection => $"{CrawlerPrefix}_Products";
    private string DiscountProductCollection => $"{CrawlerPrefix}_DiscountProducts";
    private string OfferCollection => $"{CrawlerPrefix}_Offers";
    private string DiscountOfferCollection => $"{CrawlerPrefix}_DiscountOffers";
    private string LogCollection => $"{CrawlerPrefix}_Logs";
    private string LogPath => $"KamraCrawler\\Logs\\{CrawlerPrefix}\\log_{DateTime.Now:yyyy_MM_dd__hh_mm_ss}.txt";

    public Crawler(ISelector selector, string crawlerPrefix)
        : base()
    {
        Selector = selector;
        CrawlerPrefix = crawlerPrefix;

        Logger = new ComboLogger(LogPath, LogCollection);

        OfferCardRepository = new KeyRecordRepository<KeyRecord>(OfferCardCollection);
        LinkRepository = new KeyRecordRepository<KeyRecord>(LinkCollection);
        Reader = new OfferCardLinkReader(Selector, Logger)
            .WithRepositories(
            OfferCardRepository,
            LinkRepository);

        Selector = selector;

        Processors = new List<IProcessor<TProduct, TOffer>>
        {
            new JsonProcessor<TProduct, TOffer>(),
            new HtmlProcessor<TProduct, TOffer>()
        };

        DiscountProcessors = new List<IProcessor<TProduct, TOffer>>
        {
            new DiscountHtmlProcessor<TProduct, TOffer>()
        };

        Pipeline = new ProductOfferPipeline<TProduct, TOffer>(ProductCollection, OfferCollection, Logger);
        DiscountPipeline = new ProductOfferPipeline<TProduct, TOffer>(DiscountProductCollection, DiscountOfferCollection, Logger);
    }

    public Crawler()
    {
    }



    private const int PercentileSteps = 10;

    public async Task Crawl()
    {
        await InitCrawl();

        Logger.Log(LogType.Info, $"Crawling started <{CrawlerPrefix}>");

        var (offerCards, links, discounts) = await CollectCardsAndLinksAndDiscounts();
        if (!links.Any() && !discounts.Any())
            return;

        // DEBUG
        //var offerCards = new List<string>
        //{

        //};

        //var links = new List<string>
        //{
        //    "/hu/p.scheppach-foldfuro.000000000000476724.html"
        //};

        var (products, offers) = await CollectProductsAndOffers(links);
        UpdateProductsAndOffers(products, offers);

        var (productsFromDiscounts, offersFromDiscounts) = CollectProductsAndOffersFromDiscounts(discounts);
        UpdateDiscountProductsAndOffers(productsFromDiscounts, offersFromDiscounts);

        UpdateProcessedOfferCardsAndLinks(offerCards, links);

        Logger.Log(LogType.Info, $"Crawling finished <{CrawlerPrefix}>");

        await WrapUpCrawl();
    }


    private async Task InitCrawl()
    {
        Logger.Log(LogType.Info, $"Initializing Crawler for <{CrawlerPrefix}>...");

        Logger.Log(LoggerType.Console, LogType.Info, $"========================================================");
        Logger.Log(LoggerType.Console, LogType.Info, $"      Crawling started at:  {DateTime.Now}");
        Logger.Log(LoggerType.Console, LogType.Info, $"========================================================");

        PlaywrightInstance = await Playwright.CreateAsync();
        Browser = await PlaywrightInstance.Chromium.LaunchAsync();

        Page = await Browser.NewPageAsync();

        await Page.GotoAsync(Selector.UrlBase);
        await Page.DeclineCookie(Selector.CookieSelector);

        Reader.SetPage(Page);

        InitDatabase();

        Logger.Log(LoggerType.File, LogType.Info, $"Initialization successful.");
    }

    private void InitDatabase()
    {
        var database = MongoDbConnector.MongoDbConnector.InitDatabase();

        Reader.SetConnection(database);
        Pipeline.SetConnection(database);
        DiscountPipeline.SetConnection(database);
        Logger.SetConnection(database);
    }


    private async Task<(IEnumerable<string>, IEnumerable<string>, IEnumerable<string>)> CollectCardsAndLinksAndDiscounts()
    {
        Logger.Log(LoggerType.Console, LogType.Info, $"Collecting links...");

        var (offerCards, links, discountCards, discounts) = await Reader.GetCardsAndLinksAndDiscounts();

        Logger.Log(LogType.Info, $"Collected {links.Count()} link(s) from {offerCards.Count()} offer card(s).");
        Logger.Log(LogType.Info, $"Collected {discounts.Count()} discount(s) from {discountCards.Count()} discount card(s).");
        return (offerCards, links, discounts);
    }

    private async Task<(IEnumerable<TProduct>, IEnumerable<TOffer>)> CollectProductsAndOffers(IEnumerable<string> links)
    {
        var products = new List<TProduct>();
        var offers = new List<TOffer>();

        if (!links.Any())
            return (products, offers);

        Logger.Log(LoggerType.Console, LogType.Info, $"Processing product pages...");

        var downloader = new Downloader(Page, Selector.UrlBase, Selector.CookieSelector);

        int lastProcessPercentile = 0;
        int processedLinks = 0;
        int allLinks = links.Count();
        int width = allLinks.ToString().Length + 1;

        foreach (var url in links)
        {
            processedLinks++;
            var percentile = 100 * processedLinks / allLinks;
            if (percentile >= lastProcessPercentile + PercentileSteps)
            {
                Logger.Log(LoggerType.Console, LogType.Info, $"{percentile}%");
                lastProcessPercentile += PercentileSteps;
            }

            var document = await downloader.Download(url);

            // DEBUG
            // var content = File.ReadAllText("C:\\code\\master\\Kamra\\Crawler\\Crawler\\bin\\Debug\\net6.0\\product1.txt");
            //var document = new HtmlDocument();
            //document.LoadHtml(content);

            TProduct product = null;
            TOffer offer = null;
            foreach (var processor in Processors)
            {
                (product, offer) = processor.Process(document, product, offer);
            }

            if (product.IsValid &&
                !products.Any(addedProduct => addedProduct.Key == product.Key))
            {
                products.Add(product);
            }

            if (offer.IsValid &&
                !offers.Any(addedOffer => addedOffer.ProductKey == offer.ProductKey &&
                addedOffer.ValidFrom == offer.ValidFrom &&
                addedOffer.ValidTo == offer.ValidTo))
            {
                offers.Add(offer);
            }

        }

        Logger.Log(LogType.Info, $"Processed {products.Count} product(s) and {offers.Count} offer(s).");
        return (products, offers);
    }

    private (IEnumerable<TProduct>, IEnumerable<TOffer>) CollectProductsAndOffersFromDiscounts(IEnumerable<string> discounts)
    {
        var products = new List<TProduct>();
        var offers = new List<TOffer>();

        if (!discounts.Any())
            return (products, offers);

        Logger.Log(LoggerType.Console, LogType.Info, $"Processing discounts...");

        int lastProcessPercentile = 0;
        int processedDiscounts = 0;
        int allDiscounts = discounts.Count();
        int width = allDiscounts.ToString().Length + 1;

        foreach (var discount in discounts)
        {
            processedDiscounts++;
            var percentile = 100 * processedDiscounts / allDiscounts;
            if (percentile >= lastProcessPercentile + PercentileSteps)
            {
                Logger.Log(LoggerType.Console, LogType.Info, $"{percentile}%");
                lastProcessPercentile += PercentileSteps;
            }

            var document = new HtmlDocument();
            document.LoadHtml(discount);

            TProduct product = null;
            TOffer offer = null;
            foreach (var processor in DiscountProcessors)
            {
                (product, offer) = processor.Process(document, product, offer, true);
            }

            if (product.IsValid &&
                !products.Any(addedProduct => addedProduct.Key == product.Key))
            {
                products.Add(product);
            }

            if (offer.IsValid &&
                !offers.Any(addedOffer => addedOffer.ProductKey == offer.ProductKey &&
                addedOffer.ValidFrom == offer.ValidFrom &&
                addedOffer.ValidTo == offer.ValidTo))
            {
                offers.Add(offer);
            }

        }

        Logger.Log(LogType.Info, $"Processed {products.Count} product(s) and {offers.Count} offer(s).");
        return (products, offers);
    }

    private void UpdateProductsAndOffers(IEnumerable<TProduct> products, IEnumerable<TOffer> offers)
    {
        Logger.Log(LoggerType.Console, LogType.Info, $"Updating products in database...");

        Pipeline.Run(products, offers);

        Logger.Log(LoggerType.Console, LogType.Info, $" Updated.");
    }

    private void UpdateDiscountProductsAndOffers(IEnumerable<TProduct> products, IEnumerable<TOffer> offers)
    {
        Logger.Log(LoggerType.Console, LogType.Info, $"Updating discounts in database...");

        DiscountPipeline.Run(products, offers);

        Logger.Log(LoggerType.Console, LogType.Info, $" Updated.");
    }

    private void UpdateProcessedOfferCardsAndLinks(IEnumerable<string> offerCards, IEnumerable<string> links)
    {
        Logger.Log(LoggerType.Console, LogType.Info, $"Updating offer cards in database...");

        foreach (var offerCard in offerCards)
        {
            var offerCardRecord = new KeyRecord
            {
                CreatedAt = DateTime.Now,
                Key = offerCard
            };

            OfferCardRepository.Create(offerCardRecord);
        }

        foreach (var link in links)
        {
            var linkRecord = new KeyRecord
            {
                CreatedAt = DateTime.Now,
                Key = link
            };

            LinkRepository.Create(linkRecord);
        }

        Logger.Log(LoggerType.Console, LogType.Info, $" Updated.");
    }


    private async Task WrapUpCrawl()
    {
        await Browser.DisposeAsync();
        PlaywrightInstance.Dispose();

        Logger.Log(LoggerType.Console, LogType.Info, $"========================================================");
        Logger.Log(LoggerType.Console, LogType.Info, $"      Crawling finished at: {DateTime.Now}");
        Logger.Log(LoggerType.Console, LogType.Info, $"========================================================");
    }
}