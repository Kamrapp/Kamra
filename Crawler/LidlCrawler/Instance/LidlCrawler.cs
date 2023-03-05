using Crawler;

namespace LidlCrawler.Instance
{

    public class LidlCrawler : Crawler<LidlProduct, LidlOffer>
    {
        private static readonly ISelector selector = new LidlSelector();

        public LidlCrawler()
            : base(selector, LidlProduct.Collection, LidlOffer.Collection) { }
    }
}
