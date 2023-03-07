namespace AldiCrawler.Instance;

public class AldiSelector : ISelector
{
    public string UrlBase => "https://www.aldi.hu/hu/ajanlatok";
    public string CookieSelector => "button.onetrust-reject-all-handler";

    public string OfferCardSelector => "a.item";
    public string LinkSelector => "article.wrapper > a";

    public string ProductAttribute => null;
    public bool ProductDataMatcher(string productReference) => true;

    public string ReferenceAttribute => "href";
    public bool ProductReferenceMatcher(string productReference) => productReference.StartsWith("/hu/p.");

    public string BuildUrl(string url)
    {
        if (!url.StartsWith(UrlBase))
            return UrlBase + url;

        return url;
    }

}
