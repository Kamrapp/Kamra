
using HtmlAgilityPack;

using System.Threading.Tasks;

namespace Crawler.Download
{
    public interface IDownloader
    {
        DownloaderType DownloaderType { get; set; }
        string DownloadPath { get; set; }
        Task<HtmlDocument> Download(string crawlUrl);
    }
}
