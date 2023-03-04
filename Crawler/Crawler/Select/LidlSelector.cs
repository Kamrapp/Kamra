namespace Crawler.Select
{
    public class LidlSelector : ISelector
    {
        public string UrlBase => "https://www.lidl.hu";
        public string CookieSelector => "button.cookie-alert-decline-button";

        public string CardSelector => "a.AHeroStageItems__Item--Wrapper";
        public string CandidateSelector => "div";

        public string DataAttribute => "data-selector";
        public bool ProductDataMatcher(string productReference) => productReference == "PRODUCT";

        public string ReferenceAttribute => "canonicalUrl";
        public bool ProductReferenceMatcher(string productReference) => productReference.StartsWith("/p/");

    }
}
