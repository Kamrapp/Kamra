
using HtmlAgilityPack;

using Microsoft.Playwright;

using System.Threading.Tasks;

namespace Crawler.Downloader
{
    public interface IDownloader
    {
        public IPage Page { get; set; }
        DownloaderType DownloaderType { get; set; }
        string DownloadPath { get; set; }
        Task<HtmlDocument> Download(string crawlUrl);
    }
}
