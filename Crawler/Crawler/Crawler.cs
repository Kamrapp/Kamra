using MongoDB.Driver;

namespace Crawler;
public class Crawler<TProduct, TOffer> : ICrawler
    where TProduct : BaseProduct
    where TOffer : BaseOffer
{
    public string ProcessCollectionName { get; set; }
    public IMongoDatabase Database { get; set; }
    public ISelector Selector { get; private set; }
    public List<IProcessor<TProduct, TOffer>> Processors { get; private set; }
    public IPipeline<TProduct, TOffer> Pipeline { get; private set; }

    public IScheduler Scheduler { get; private set; }

    private IPlaywright PlaywrightInstance { get; set; }
    private IBrowser Browser { get; set; }
    private IPage Page { get; set; }

    public Crawler(ISelector selector, string processCollectionName, string productCollectionName, string offerCollectionName)
        : base()
    {
        ProcessCollectionName = processCollectionName;
        Database = MongoDbConnector.MongoDbConnector.InitDatabase();

        AddSelector(selector)
            .AddProcessor(new JsonProcessor<TProduct, TOffer> { })
            .AddProcessor(new HtmlProcessor<TProduct, TOffer> { })
            .AddPipeline(new MongoDbPipeline<TProduct, TOffer>()
                .WithServices(
                new ProductService<TProduct>(Database, productCollectionName),
                new OfferService<TOffer>(Database, offerCollectionName)
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

    public Crawler<TProduct, TOffer> AddScheduler(IScheduler scheduler)
    {
        Scheduler = scheduler;
        return this;
    }

    private const int PercentileSteps = 10;

    public async Task Crawl()
    {
        Console.WriteLine($"========================================================");
        Console.WriteLine($"      Crawling started at:  {DateTime.UtcNow}");
        Console.WriteLine($"========================================================");
        Console.WriteLine();

        Console.Write($"Initializing Crawler for <{typeof(TProduct).Name}>...");
        {
            await InitCrawl();
        }
        Console.WriteLine($" initialized.");

        IEnumerable<string> links;
        Console.WriteLine($"Collecting links...");
        {
            var reader = new Reader(Page, Selector);

            links = await reader.GetLinks();
        }
        Console.WriteLine($"Collected {links.Count()}.");

        // DEBUG
        //var links = new List<string>
        //    {
        //        "/p/furdoszobaszekreny/p499363",
        //        "/p/keskeny-furdoszobaszekreny/p499331"
        //    };

        var unprocessedLinks = new List<string>();
        Console.WriteLine($"Filtering processed links...");
        {
            if (!links.Any())
                return;



            foreach (var link in links)
            {
                unprocessedLinks.Add(link);
            }
        }
        Console.Write($" Remains {links.Count()}.");


        var products = new List<TProduct>();
        var offers = new List<TOffer>();
        Console.WriteLine($"Processing product pages...");
        {
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
        }
        Console.WriteLine($" Processed {products.Count} product(s).");
        Console.WriteLine($" Processed {offers.Count} offer(s).");

        Console.Write($"Updating products in database...");
        {
            Pipeline.Run(products, offers);
        }
        Console.WriteLine($" Updated.");

        await WrapUpCrawl();
        Console.WriteLine();
        Console.WriteLine($"========================================================");
        Console.WriteLine($"      Crawling finished at: {DateTime.UtcNow}");
        Console.WriteLine($"========================================================");
    }

    private async Task InitCrawl()
    {
        PlaywrightInstance = await Playwright.CreateAsync();
        Browser = await PlaywrightInstance.Chromium.LaunchAsync();

        Page = await Browser.NewPageAsync();

        await Page.GotoAsync(Selector.UrlBase);
        await Page.DeclineCookie(Selector.CookieSelector);
    }

    private async Task WrapUpCrawl()
    {
        await Browser.DisposeAsync();
        PlaywrightInstance.Dispose();
    }
}