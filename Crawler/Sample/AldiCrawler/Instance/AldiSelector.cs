namespace AldiCrawler.Instance;

public class AldiSelector : ISelector
{
    public string UrlBase => "https://www.aldi.hu";
    public string OfferUrl => $"{UrlBase}/hu/ajanlatok";
    public string CookieSelector => "button[id='onetrust-reject-all-handler']";

    public string OfferCardSelector => "a.item";

    public bool IsOfferCardDiscountCollection(string offerCardLink) => !offerCardLink.StartsWith(UrlBase);

    public string LinkSelector => "article.wrapper > a";
    public string ReferenceAttribute => "href";
    public bool ProductReferenceMatcher(string productReference) => productReference.StartsWith("/hu/p.");

    public string DiscountSelector => "main";
    public string DiscountHeaderFilter => "E05-basic-text";
    public string DiscountHeaderSelector => "//h2/a";
    public string DiscountGroupFilter => "E12-grid-gallery";
    public string DiscountElementSelector => "div/div/div/div/div/div[@class='item ']";

    public string BuildUrl(string url)
    {
        if (!url.StartsWith(UrlBase))
            return UrlBase + url;

        return url;
    }
    public DiscountCollectorType DiscountCollectorType => DiscountCollectorType.Aldi;

}
