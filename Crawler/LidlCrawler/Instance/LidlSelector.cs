namespace LidlCrawler.Instance;

public class LidlSelector : ISelector
{
    public string UrlBase => "https://www.lidl.hu";

    public string OfferUrl => UrlBase;
    public string CookieSelector => "button.cookie-alert-decline-button";

    public string OfferCardSelector => "a.AHeroStageItems__Item--Wrapper";
    public string LinkSelector => "div";

    public string ProductAttribute => "data-selector";
    public bool ProductDataMatcher(string productReference) => productReference == "PRODUCT";

    public string ReferenceAttribute => "canonicalUrl";
    public bool ProductReferenceMatcher(string productReference) => productReference.StartsWith("/p/");

    public string BuildUrl(string url)
    {
        return $"{UrlBase}{url}";
    }
}
