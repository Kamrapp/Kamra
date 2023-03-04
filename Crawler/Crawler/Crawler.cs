using Crawler.Downloader;
using Crawler.Pipeline;
using Crawler.Processor;
using Crawler.Scheduler;
using Crawler.Data.Repository;

using System.Threading.Tasks;
using Crawler.Reader;
using Microsoft.Playwright;

namespace Crawler
{
    public class Crawler<TEntity> : ICrawler where TEntity : class, IEntity
    {
        public IReader Reader { get; private set; }
        public IDownloader Downloader { get; private set; }
        public IProcessor<TEntity> Processor { get; private set; }
        public IScheduler Scheduler { get; private set; }
        public IPipeline<TEntity> Pipeline { get; private set; }
        public string UrlBase { get; private set; }

        public Crawler(string urlBase)
        {
            UrlBase = urlBase;
        }

        public Crawler<TEntity> AddReader(IReader reader)
        {
            Reader = reader;
            return this;
        }

        public Crawler<TEntity> AddDownloader(IDownloader downloader)
        {
            Downloader = downloader;
            return this;
        }

        public Crawler<TEntity> AddProcessor(IProcessor<TEntity> processor)
        {
            Processor = processor;
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
            using var pw = await Playwright.CreateAsync();
            await using var browser = await pw.Chromium.LaunchAsync();

            Reader.Page = await browser.NewPageAsync();
            var links = await Reader.GetLinks();

            foreach (var url in links)
            {
                var document = await Downloader.Download(url);
                var entity = await Processor.Process(document);
                await Pipeline.Run(entity);
            }
        }
    }
}
