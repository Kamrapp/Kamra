using Crawler.Download;
using Crawler.Data.Models;
using Crawler.Pipeline;
using Crawler.Processor;
using Crawler.Request;

using System.Threading.Tasks;

namespace Crawler.Sample
{
    class Program
    {
        static async Task Main(string[] args)
        {
            var crawler = new Crawler<Catalog>()
                                 .AddRequest(new BaseRequest { Url = "https://www.lidl.hu/ajanlataink", Regex = @"/p/.*/p.+", TimeOut = 5000 })
                                 //@".*itm/.+"
                                 .AddDownloader(new BaseDownloader { DownloaderType = DownloaderType.FromMemory, DownloadPath = @"C:\Users\Koala\Downloads\CrawlerSampleData\download\" })
                                 .AddProcessor(new BaseProcessor<Catalog> { })
                                 .AddPipeline(new BasePipeline<Catalog> { });

            await crawler.Crawl();
        }
    }
}
