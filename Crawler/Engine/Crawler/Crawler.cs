using MongoDB.Driver;

namespace Crawler;
public class Crawler<TProduct, TOffer> : ICrawler
    where TProduct : BaseProduct
    where TOffer : BaseOffer
{
    private ISelector Selector { get; set; }
    private List<IProcessor<TProduct, TOffer>> Processors { get; set; }
    private IPipeline<TProduct, TOffer> Pipeline { get; set; }
    private IKeyRecordRepository<KeyRecord> OfferCardRepository { get; set; }
    private IKeyRecordRepository<KeyRecord> LinkRepository { get; set; }
    private IReader Reader { get; set; }

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
        Selector = selector;
        CrawlerPrefix = crawlerPrefix;

        OfferCardRepository = new KeyRecordRepository<KeyRecord>(OfferCardCollection);
        LinkRepository = new KeyRecordRepository<KeyRecord>(LinkCollection);
        Reader = new OfferCardLinkReader(Selector)
            .WithRepositories(
            OfferCardRepository,
            LinkRepository);

        Selector = selector;

        Processors = new List<IProcessor<TProduct, TOffer>>
        {
            new JsonProcessor<TProduct, TOffer>(),
            new HtmlProcessor<TProduct, TOffer>()
        };

        Pipeline = new ProductOfferPipeline<TProduct, TOffer>(ProductCollection, OfferCollection);
    }

    public Crawler()
    {
    }



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


    private async Task InitCrawl()
    {
        Console.WriteLine($"========================================================");
        Console.WriteLine($"      Crawling started at:  {DateTime.Now}");
        Console.WriteLine($"========================================================");
        Console.WriteLine();

        Console.WriteLine($"Initializing Crawler for <{CrawlerPrefix}>...");

        PlaywrightInstance = await Playwright.CreateAsync();
        Browser = await PlaywrightInstance.Chromium.LaunchAsync();

        Page = await Browser.NewPageAsync();

        await Page.GotoAsync(Selector.UrlBase);
        await Page.DeclineCookie(Selector.CookieSelector);

        Reader.SetPage(Page);

        InitDatabase();

        Console.WriteLine($"Initialization successful.");
    }

    private void InitDatabase()
    {
        var database = MongoDbConnector.MongoDbConnector.InitDatabase();

        Reader.SetConnection(database);
        Pipeline.SetConnection(database);
    }


    private async Task<(IEnumerable<string>, IEnumerable<string>)> CollectCardsAndLinks()
    {
        Console.WriteLine($"Collecting links...");

        var (offerCards, links) = await Reader.GetCardsAndLinks();

        Console.WriteLine($"Collected {links.Count()} link(s) from {offerCards.Count()} card(s).");
        return (offerCards, links);
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

        Console.WriteLine();
        Console.WriteLine($"Processed {products.Count} product(s) and {offers.Count} offer(s).");
        return (products, offers);
    }


    private void UpdateProductsAndOffers(IEnumerable<TProduct> products, IEnumerable<TOffer> offers)
    {
        Console.Write($"Updating products in database...");

        Pipeline.Run(products, offers);

        Console.WriteLine($" Updated.");
    }

    private void UpdateProcessedOfferCardsAndLinks(IEnumerable<string> offerCards, IEnumerable<string> links)
    {
        Console.Write($"Updating offer cards in database...");

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

        Console.WriteLine($" Updated.");
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