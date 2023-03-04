namespace Crawler.Reader
{
    public interface ISelector
    {
        string UrlBase { get; }
        string CookieSelector { get; }
        string CandidateSelector { get; }
        string CardSelector { get; }
        string ReferenceAttribute { get; }
        string DataAttribute { get; }

        bool ProductReferenceFilter(string productReference);
        bool ProductDataFilter(string productReference);
    }
}
