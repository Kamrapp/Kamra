using Crawler.Select;
using Crawler.Read;
using Crawler.Download;
using Crawler.Process;
using Crawler.Pipeline;
using Crawler.Schedule;
using Crawler.Data.Repository;

using System.Threading.Tasks;
using Microsoft.Playwright;
using System.Linq;
using System.Collections.Generic;

namespace Crawler
{
    public class Crawler<TEntity> : ICrawler where TEntity : class, IEntity
    {
        public ISelector Selector { get; private set; }
        public IProcessor<TEntity> Processor { get; private set; }
        public IScheduler Scheduler { get; private set; }
        public IPipeline<TEntity> Pipeline { get; private set; }

        private IPlaywright PlaywrightInstance { get; set; }
        private IBrowser Browser { get; set; }
        private IPage Page { get; set; }

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
            foreach (var url in links)
            {
                var document = await downloader.Download(url);
                var entity = await Processor.Process(document);
                await Pipeline.Run(entity);
            }

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

            await Page.GotoAsync(Selector.UrlBase);
            await DeclineCookie();
        }

        private async Task WrapUpCrawl()
        {
            await Browser.DisposeAsync();
            PlaywrightInstance.Dispose();
        }
    }
}
