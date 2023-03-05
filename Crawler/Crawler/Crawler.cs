namespace Crawler;
public class Crawler<TProductEntity, TOfferEntity> : ICrawler
    where TProductEntity : BaseProduct
    where TOfferEntity : BaseOffer
{
    public ISelector Selector { get; private set; }
    public List<IProcessor<TProductEntity, TOfferEntity>> Processors { get; private set; }
    public IPipeline<TProductEntity, TOfferEntity> Pipeline { get; private set; }

    public IScheduler Scheduler { get; private set; }

    private IPlaywright PlaywrightInstance { get; set; }
    private IBrowser Browser { get; set; }
    private IPage Page { get; set; }

    public Crawler(ISelector selector, string productCollectionName, string offerCollectionName)
        : base()
    {
        AddSelector(selector)
            .AddProcessor(new JsonProcessor<TProductEntity, TOfferEntity> { })
            .AddProcessor(new HtmlProcessor<TProductEntity, TOfferEntity> { })
            .AddPipeline(new MongoDbPipeline<TProductEntity, TOfferEntity>()
                .WithServices(
                new ProductService<TProductEntity>(productCollectionName),
                new OfferService<TOfferEntity>(offerCollectionName)
                )
            );
    }

    public Crawler()
    {
    }

    public Crawler<TProductEntity, TOfferEntity> AddSelector(ISelector selector)
    {
        Selector = selector;
        return this;
    }

    public Crawler<TProductEntity, TOfferEntity> AddProcessor(IProcessor<TProductEntity, TOfferEntity> processor)
    {
        Processors ??= new List<IProcessor<TProductEntity, TOfferEntity>>();

        Processors.Add(processor);
        return this;
    }

    public Crawler<TProductEntity, TOfferEntity> AddPipeline(IPipeline<TProductEntity, TOfferEntity> pipeline)
    {
        Pipeline = pipeline;
        return this;
    }

    public Crawler<TProductEntity, TOfferEntity> AddScheduler(IScheduler scheduler)
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

        Console.Write($"Initializing Crawler for <{typeof(TProductEntity).Name}>...");
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

        if (!links.Any())
            return;

        var products = new List<TProductEntity>();
        var offers = new List<TOfferEntity>();
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

                TProductEntity product = null;
                TOfferEntity offer = null;
                foreach (var processor in Processors)
                {
                    (product, offer) = processor.Process(document, product, offer);
                }

                if (!products.Any(addedEntity => addedEntity.Key == product.Key))
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