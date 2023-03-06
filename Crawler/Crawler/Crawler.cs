using MongoDB.Driver;

namespace Crawler;
public class Crawler<TProduct, TOffer> : ICrawler
    where TProduct : BaseProduct
    where TOffer : BaseOffer
{
    private ISelector Selector { get; set; }
    private List<IProcessor<TProduct, TOffer>> Processors { get; set; }
    private IPipeline<TProduct, TOffer> Pipeline { get; set; }
    private IKeyRecordService<KeyRecord> OfferCardService { get; set; }
    private IKeyRecordService<KeyRecord> LinkService { get; set; }
    private IReader Reader { get; set; }

    //private IScheduler Scheduler { get; set; }

    private IPlaywright PlaywrightInstance { get; set; }
    private IBrowser Browser { get; set; }
    private IPage Page { get; set; }
    private string CrawlerPrefix { get; set; }

    private string OfferCardCollection => $"{CrawlerPrefix}_OfferCards";
    private string LinkCollection => $"{CrawlerPrefix}_Links";
    private string ProductCollection => $"{CrawlerPrefix}_Products";
    private string OfferCollection => $"{CrawlerPrefix}_Offers";

    public Crawler(ISelector selector, string crawlerPrefix)
        : base()
    {
        CrawlerPrefix = crawlerPrefix;

        OfferCardService = new KeyRecordService<KeyRecord>(OfferCardCollection);
        LinkService = new KeyRecordService<KeyRecord>(LinkCollection);
        Reader = new OfferCardLinkReader(Page, Selector)
            .WithServices(
            OfferCardService,
            LinkService);

        AddSelector(selector)
            .AddProcessor(new JsonProcessor<TProduct, TOffer> { })
            .AddProcessor(new HtmlProcessor<TProduct, TOffer> { })
            .AddPipeline(new ProductOfferPipeline<TProduct, TOffer>()
                .WithServices(
                new ProductService<TProduct>(ProductCollection),
                new OfferService<TOffer>(OfferCollection)
                )
            );
    }

    public Crawler()
    {
    }

    public Crawler<TProduct, TOffer> AddSelector(ISelector selector)
    {
        Selector = selector;
        return this;
    }

    public Crawler<TProduct, TOffer> AddProcessor(IProcessor<TProduct, TOffer> processor)
    {
        Processors ??= new List<IProcessor<TProduct, TOffer>>();

        Processors.Add(processor);
        return this;
    }

    public Crawler<TProduct, TOffer> AddPipeline(IPipeline<TProduct, TOffer> pipeline)
    {
        Pipeline = pipeline;
        return this;
    }

    //public Crawler<TProduct, TOffer> AddScheduler(IScheduler scheduler)
    //{
    //    Scheduler = scheduler;
    //    return this;
    //}

    private const int PercentileSteps = 10;

    public async Task Crawl()
    {
        await InitCrawl();

        var (offerCards, links) = await CollectCardsAndLinks();
        if (!links.Any())
            return;

        var (products, offers) = await CollectProductsAndOffers(links);

        UpdateProductsAndOffers(products, offers);
        UpdateProcessedOfferCardsAndLinks(offerCards, links);

        await WrapUpCrawl();
    }

    private void InitDatabase()
    {
        var database = MongoDbConnector.MongoDbConnector.InitDatabase();

        Reader.SetConnection(database);
        Pipeline.SetConnection(database);
    }

    private void UpdateProcessedOfferCardsAndLinks(IEnumerable<string> offerCards, IEnumerable<string> links)
    {
        foreach (var offerCard in offerCards)
        {
            var offerCardRecord = new KeyRecord
            {
                CreatedAt = DateTime.Now,
                Key = offerCard
            };

            LinkService.Create(offerCardRecord);
        }

        foreach (var link in links)
        {
            var linkRecord = new KeyRecord
            {
                CreatedAt = DateTime.Now,
                Key = link
            };

            LinkService.Create(linkRecord);
        }
    }

    private void UpdateProductsAndOffers(IEnumerable<TProduct> products, IEnumerable<TOffer> offers)
    {
        Console.Write($"Updating products in database...");

        Pipeline.Run(products, offers);

        Console.WriteLine($" Updated.");
    }

    private async Task<(IEnumerable<TProduct>, IEnumerable<TOffer>)> CollectProductsAndOffers(IEnumerable<string> links)
    {
        Console.WriteLine($"Processing product pages...");

        var products = new List<TProduct>();
        var offers = new List<TOffer>();

        var downloader = new Downloader(Page, Selector.UrlBase, Selector.CookieSelector);

        int lastProcessPercentile = 0;
        int processedLinks = 0;
        int allLinks = links.Count();
        int width = allLinks.ToString().Length + 1;

        foreach (var url in links)
        {
            processedLinks++;
            var percentile = 100 * processedLinks / allLinks;
            if (percentile > lastProcessPercentile + PercentileSteps)
            {
                Console.Write($"█");
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

            if (!products.Any(addedProduct => addedProduct.Key == product.Key))
            {
                products.Add(product);
            }

            if (!offers.Any(addedOffer => addedOffer.ProductKey == offer.ProductKey &&
                addedOffer.ValidFrom == offer.ValidFrom &&
                addedOffer.ValidTo == offer.ValidTo))
            {
                offers.Add(offer);
            }

        }

        Console.WriteLine($" Processed {products.Count} product(s).");
        Console.WriteLine($" Processed {offers.Count} offer(s).");
        return (products, offers);
    }

    private async Task<(IEnumerable<string>, IEnumerable<string>)> CollectCardsAndLinks()
    {
        Console.WriteLine($"Collecting links...");

        var (offerCards, links) = await Reader.GetCardsAndLinks();

        Console.WriteLine($"Collected {links.Count()} links from {offerCards.Count()} cards.");
        return (offerCards, links);
    }

    private async Task InitCrawl()
    {
        Console.WriteLine($"========================================================");
        Console.WriteLine($"      Crawling started at:  {DateTime.Now}");
        Console.WriteLine($"========================================================");
        Console.WriteLine();

        Console.Write($"Initializing Crawler for <{typeof(TProduct).Name}>...");

        PlaywrightInstance = await Playwright.CreateAsync();
        Browser = await PlaywrightInstance.Chromium.LaunchAsync();

        Page = await Browser.NewPageAsync();

        await Page.GotoAsync(Selector.UrlBase);
        await Page.DeclineCookie(Selector.CookieSelector);

        InitDatabase();

        Console.WriteLine($" initialized.");
    }

    private async Task WrapUpCrawl()
    {
        await Browser.DisposeAsync();
        PlaywrightInstance.Dispose();

        Console.WriteLine();
        Console.WriteLine($"========================================================");
        Console.WriteLine($"      Crawling finished at: {DateTime.Now}");
        Console.WriteLine($"========================================================");
    }
}