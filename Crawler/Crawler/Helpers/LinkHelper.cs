namespace Crawler.Helpers;

public static class LinkHelper
{
    public static async Task<string> GetElementLink(IElementHandle elementHandle)
    {
        string href;
        try
        {
            href = await elementHandle.GetAttributeAsync("href");
        }
        catch (Exception)
        {
            return null;
        }

        if (string.IsNullOrEmpty(href))
            return null;

        var cleanHref = href[..href.IndexOf("?")];
        return cleanHref;
    }
}
