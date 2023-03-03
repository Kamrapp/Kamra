using Crawler.Download;
using Crawler.Data.Models;
using Crawler.Pipeline;
using Crawler.Processor;
using Crawler.Request;
using System.Threading.Tasks;
using Crawler.Downloader;

namespace Crawler.Sample
{
    class Program
    {
        static async Task Main(string[] args)
        {
            // run this once at to install PlayWright
            //var exitCode = Microsoft.Playwright.Program.Main(new[] { "install" });

            //var links = await LinkReader.GetLinks("https://www.lidl.hu");

            var crawler = new Crawler<Catalog>()
                                 .AddRequest(new BaseRequest { Url = "https://www.lidl.hu", Regex = @"/p/.*/p.+", TimeOut = 5000 })
                                 //@".*itm/.+"
                                 .AddDownloader(new BaseDownloader { DownloaderType = DownloaderType.FromWeb, DownloadPath = @"C:\Users\Koala\Downloads\CrawlerSampleData\download\" })
                                 .AddProcessor(new BaseProcessor<Catalog> { })
                                 .AddPipeline(new BasePipeline<Catalog> { });

            await crawler.Crawl();
        }
    }
}
