namespace Shared.Utils;

public interface ISelector
{
    string UrlBase { get; }
    string CookieSelector { get; }

    string CardSelector { get; }
    string CandidateSelector { get; }

    string DataAttribute { get; }
    bool ProductDataMatcher(string productReference);

    string ReferenceAttribute { get; }
    bool ProductReferenceMatcher(string productReference);
}
