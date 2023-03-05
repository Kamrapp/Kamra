namespace Crawler.Download;

public class Downloader : IDownloader
{
    public IPage Page { get; set; }
    public string UrlBase { get; set; }

    public Downloader(IPage page, string urlBase)
    {
        Page = page;
        UrlBase = urlBase;
    }

    public async Task<HtmlDocument> Download(string url)
    {
        await Page.GotoAsync($"{UrlBase}{url}");

        var content = await Page.ContentAsync();

        var doc = new HtmlDocument();
        doc.LoadHtml(content);

        return doc;
    }
}
