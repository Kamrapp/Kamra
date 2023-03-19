namespace Shared.Utils;

public interface ISelector
{
    string UrlBase { get; }
    string OfferUrl { get; }
    string CookieSelector { get; }

    string OfferCardSelector { get; }
    string LinkSelector { get; }

    string ReferenceAttribute { get; }
    bool ProductReferenceMatcher(string productReference);

    //when there is a link to a collection site and products have no further links to open
    // e.g.: Aldi has some offer pages where there are discounts but they do not lead to further pages on product-level
    bool IsOfferCardDiscountCollection(string offerCardLink);
    string DiscountSelector { get; }
    string DiscountHeaderFilter { get; }
    string DiscountHeaderSelector { get; }
    string DiscountGroupFilter { get; }
    string DiscountElementSelector { get; }

    DiscountCollectorType DiscountCollectorType { get; }

    public string BuildUrl(string url);
}

public enum DiscountCollectorType
{
    Basic,
    Aldi
}
