namespace Crawler.Download;

public class Downloader : IDownloader
{
    public IPage Page { get; set; }
    public string UrlBase { get; set; }
    public string CookieSelector { get; set; }
    private readonly float BaseTimeoutInMs = (float)new TimeSpan(1, 0, 0).TotalMilliseconds;

    public Downloader(IPage page, string urlBase, string cookieSelector)
    {
        Page = page;
        UrlBase = urlBase;
        CookieSelector = cookieSelector;
    }

    public async Task<HtmlDocument> Download(string url)
    {
        await Page.GotoAsync($"{UrlBase}{url}", new PageGotoOptions { Timeout = BaseTimeoutInMs });
        await Page.DeclineCookie(CookieSelector);

        var content = await Page.ContentAsync();

        var doc = new HtmlDocument();
        doc.LoadHtml(content);

        return doc;
    }
}
