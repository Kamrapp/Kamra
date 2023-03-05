using System.Runtime.CompilerServices;

namespace Crawler;
public class Crawler<TEntity> : ICrawler where TEntity : BaseEntity
{
    public ISelector Selector { get; private set; }
    public List<IProcessor<TEntity>> Processors { get; private set; }
    public IScheduler Scheduler { get; private set; }
    public IPipeline<TEntity> Pipeline { get; private set; }

    private IPlaywright PlaywrightInstance { get; set; }
    private IBrowser Browser { get; set; }
    private IPage Page { get; set; }

    public Crawler(ISelector selector, string collectionName)
        : base()
    {
        AddSelector(selector)
            .AddProcessor(new JsonProcessor<TEntity> { })
            .AddProcessor(new HtmlProcessor<TEntity> { })
            .AddPipeline(new MongoDbPipeline<TEntity>()
                .WithService(new GenericService<TEntity>(collectionName))
                );
    }

    public Crawler()
    {
    }

    public Crawler<TEntity> AddSelector(ISelector selector)
    {
        Selector = selector;
        return this;
    }

    public Crawler<TEntity> AddProcessor(IProcessor<TEntity> processor)
    {
        Processors ??= new List<IProcessor<TEntity>>();

        Processors.Add(processor);
        return this;
    }

    public Crawler<TEntity> AddScheduler(IScheduler scheduler)
    {
        Scheduler = scheduler;
        return this;
    }

    public Crawler<TEntity> AddPipeline(IPipeline<TEntity> pipeline)
    {
        Pipeline = pipeline;
        return this;
    }

    private const int PercentileSteps = 10;

    public async Task Crawl()
    {
        Console.WriteLine($"========================================================");
        Console.WriteLine($"      Crawling started at:  {DateTime.UtcNow           }");
        Console.WriteLine($"========================================================");
        Console.WriteLine();

        Console.Write($"Initializing Crawler for <{typeof(TEntity).Name}>...");
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

        var entities = new List<TEntity>();
        Console.Write($"Processing product pages...");
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

                TEntity entity = null;
                foreach (var processor in Processors)
                {
                    entity = processor.Process(document, entity);
                }

                if (entities.Any(addedEntity => addedEntity.Key == entity.Key))
                {
                    //Console.WriteLine($"Entity of type <{typeof(TEntity).Name}> with ID <{entity.Id}> is already collected.");
                    continue;
                }

                entities.Add(entity);
            }
        }
        Console.WriteLine($" Processed {entities.Count}.");

        Console.Write($"Updating products in database...");
        {
            Pipeline.Run(entities);
        }
        Console.WriteLine($" Updated.");

        await WrapUpCrawl();
        Console.WriteLine();
        Console.WriteLine($"========================================================");
        Console.WriteLine($"      Crawling finished at: {DateTime.UtcNow           }");
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