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

        if (href.IndexOf("?") != -1)
            href = href[..href.IndexOf("?")];

        return href;
    }
}
