using Crawler.Select;
using Crawler.Read;
using Crawler.Download;
using Crawler.Process;
using Crawler.Data.Models;
using Crawler.Pipeline;
using System.Threading.Tasks;

namespace Crawler.Sample
{
    class Program
    {
        static async Task Main(string[] args)
        {
            // run this once at to install PlayWright
            //var exitCode = Microsoft.Playwright.Program.Main(new[] { "install" });

            var crawler = new Crawler<LidlProduct>()
                                 .AddSelector(new LidlSelector())
                                 .AddProcessor(new JsonProcessor<LidlProduct> { })
                                 .AddPipeline(new BasePipeline<LidlProduct> { });

            await crawler.Crawl();
        }
    }
}
