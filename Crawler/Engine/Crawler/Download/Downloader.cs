namespace Crawler.Download;

public class Downloader : IDownloader
{
    public IPage Page { get; set; }
    public string UrlBase { get; set; }
    public string CookieSelector { get; set; }

    public Downloader(IPage page, string urlBase, string cookieSelector)
    {
        Page = page;
        UrlBase = urlBase;
        CookieSelector = cookieSelector;
    }

    public async Task<HtmlDocument> Download(string url)
    {
        await Page.GotoAsync($"{UrlBase}{url}");
        await Page.DeclineCookie(CookieSelector);

        var content = await Page.ContentAsync();

        var doc = new HtmlDocument();
        doc.LoadHtml(content);

        return doc;
    }
}
