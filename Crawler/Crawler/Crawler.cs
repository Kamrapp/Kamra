using Crawler.Download;
using Crawler.Pipeline;
using Crawler.Processor;
using Crawler.Request;
using Crawler.Scheduler;
using Crawler.Data.Repository;
using Crawler.Downloader;

using System.Threading.Tasks;

namespace Crawler
{
    public class Crawler<TEntity> : ICrawler where TEntity : class, IEntity
    {
        public IRequest Request { get; private set; }
        public IDownloader Downloader { get; private set; }
        public IProcessor<TEntity> Processor { get; private set; }
        public IScheduler Scheduler { get; private set; }
        public IPipeline<TEntity> Pipeline { get; private set; }

        public Crawler()
        {

        }

        public Crawler<TEntity> AddRequest(IRequest request)
        {
            Request = request;
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
            var linkReader = new LinkReader(Request);
            var links = await linkReader.GetLinks(Request.Url, 0);

            foreach (var url in links)
            {
                var document = await Downloader.Download($"https://www.lidl.hu/{url}");
                var entity = await Processor.Process(document);
                await Pipeline.Run(entity);
            }
        }
    }
}
