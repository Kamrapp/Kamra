namespace Shared.Utils;

public interface ISelector
{
    string UrlBase { get; }
    string CookieSelector { get; }

    string OfferCardSelector { get; }
    string LinkSelector { get; }

    string ProductAttribute { get; }
    bool ProductDataMatcher(string productReference);

    string ReferenceAttribute { get; }
    bool ProductReferenceMatcher(string productReference);

    public string BuildUrl(string url);
}
