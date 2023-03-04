using Crawler.Downloader;
using Crawler.Data.Models;
using Crawler.Pipeline;
using Crawler.Processor;
using System.Threading.Tasks;
using Crawler.Reader;

namespace Crawler.Sample
{
    class Program
    {
        static async Task Main(string[] args)
        {
            // run this once at to install PlayWright
            //var exitCode = Microsoft.Playwright.Program.Main(new[] { "install" });

            var urlBase = "https://www.lidl.hu";

            var crawler = new Crawler<Catalog>(urlBase)
                                 .AddReader(new Reader.Reader(new LidlSelector()))
                                 //@".*itm/.+"
                                 .AddDownloader(new LidlDownloader())
                                 .AddProcessor(new BaseProcessor<Catalog> { })
                                 .AddPipeline(new BasePipeline<Catalog> { });

            await crawler.Crawl();
        }
    }
}
