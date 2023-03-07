namespace Crawler.Helpers;

public static class CookieHelper
{
    public static async Task DeclineCookie(this IPage page, string cookieSelector)
    {
        var cookieDeclineButton = await page.QuerySelectorAsync(cookieSelector);
        if (cookieDeclineButton != null)
        {
            await cookieDeclineButton.ClickAsync();
        }
    }
}
