namespace Crawler.Download;

public interface IDownloader
{
    public IPage Page { get; set; }
    Task<HtmlDocument> Download(string crawlUrl);
}
