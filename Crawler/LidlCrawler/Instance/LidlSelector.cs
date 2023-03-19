namespace LidlCrawler.Instance;

public class LidlSelector : ISelector
{
    public string UrlBase => "https://www.lidl.hu";

    public string OfferUrl => UrlBase;
    public string CookieSelector => "button.cookie-alert-decline-button";

    public string OfferCardSelector => "a.AHeroStageItems__Item--Wrapper";
    public string LinkSelector => "div[data-selector='PRODUCT']";

    public string ReferenceAttribute => "canonicalUrl";
    public bool ProductReferenceMatcher(string productReference) => productReference.StartsWith("/p/");

    // no such thing needed
    public bool IsOfferCardDiscountCollection(string offerCardLink) => false;
    public string DiscountSelector => "";
    public string DiscountHeaderFilter => "";
    public string DiscountHeaderSelector => "";
    public string DiscountGroupFilter => "";
    public string DiscountElementSelector => "";

    public string BuildUrl(string url)
    {
        return $"{UrlBase}{url}";
    }

    public DiscountCollectorType DiscountCollectorType => DiscountCollectorType.Basic;
}
