using Crawler;

namespace LidlCrawler.Instance
{

    public class LidlCrawler : Crawler<LidlProduct, LidlOffer>
    {
        private static readonly ISelector selector = new LidlSelector();

        private const string LidlProcessCollection = "LidlProcesses";

        public LidlCrawler()
            : base(selector, LidlProcessCollection, LidlProduct.Collection, LidlOffer.Collection) { }
    }
}
