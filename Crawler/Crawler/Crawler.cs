namespace Crawler;
public class Crawler<TEntity> : ICrawler where TEntity : class, IDbRecord
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
        Processors = new List<IProcessor<TEntity>>();
    }

    public Crawler<TEntity> AddSelector(ISelector selector)
    {
        Selector = selector;
        return this;
    }

    public Crawler<TEntity> AddProcessor(IProcessor<TEntity> processor)
    {
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

    public async Task Crawl()
    {
        await InitCrawl();

        var reader = new Reader(Page, Selector, 3);

        //var links = await reader.GetLinks();

        // DEBUG
        var links = new List<string>
            {
                "/p/furdoszobaszekreny/p499363",
                "/p/keskeny-furdoszobaszekreny/p499331"
            };

        if (!links.Any())
            return;

        var downloader = new Downloader(Page, Selector.UrlBase);

        var entities = new List<TEntity>();
        foreach (var url in links)
        {
            //var document = await downloader.Download(url);

            // DEBUG
            var content = File.ReadAllText("C:\\code\\master\\Kamra\\Crawler\\Crawler\\bin\\Debug\\net6.0\\product1.txt");

            var document = new HtmlDocument();
            document.LoadHtml(content);

            TEntity entity = null;
            foreach (var processor in Processors)
            {
                entity = processor.Process(document, entity);
            }

            if (entities.Any(entity => entity.Id == entity.Id))
            {
                Console.WriteLine($"Entity of type <{typeof(TEntity).Name}> with ID <{entity.Id}> is already collected.");
                continue;
            }

            entities.Add(entity);
        }

        Pipeline.Run(entities);
        await WrapUpCrawl();
    }

    private async Task DeclineCookie()
    {
        var cookieDeclineButton = await Page.QuerySelectorAsync(Selector.CookieSelector);
        if (cookieDeclineButton != null)
        {
            await cookieDeclineButton.ClickAsync();
        }
    }

    private async Task InitCrawl()
    {
        PlaywrightInstance = await Playwright.CreateAsync();
        Browser = await PlaywrightInstance.Chromium.LaunchAsync();

        Page = await Browser.NewPageAsync();

        //await Page.GotoAsync(Selector.UrlBase);
        //await DeclineCookie();
    }

    private async Task WrapUpCrawl()
    {
        await Browser.DisposeAsync();
        PlaywrightInstance.Dispose();
    }
}