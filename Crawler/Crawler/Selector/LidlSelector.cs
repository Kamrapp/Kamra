namespace Crawler.Reader
{
    public class LidlSelector : ISelector
    {
        public string UrlBase => "https://www.lidl.hu";
        public string CookieSelector => "button.cookie-alert-decline-button";
        public string CandidateSelector => "div";
        public string CardSelector => "a.AHeroStageItems__Item--Wrapper";
        public string ReferenceAttribute => "canonicalUrl";
        public string DataAttribute => "data-selector";

        public bool ProductReferenceFilter(string productReference) => productReference.StartsWith("/p/");
        public bool ProductDataFilter(string productReference) => productReference == "PRODUCT";

    }
}
