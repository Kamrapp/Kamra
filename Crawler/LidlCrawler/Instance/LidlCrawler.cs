using Crawler;

namespace LidlCrawler.Instance
{

    public class LidlCrawler : Crawler<LidlProduct, LidlOffer>
    {
        private static readonly ISelector selector = new LidlSelector();

        private const string CrawlerPrefix = "Lidl";

        public LidlCrawler()
            : base(selector, CrawlerPrefix) { }
    }
}
