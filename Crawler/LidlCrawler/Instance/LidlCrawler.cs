using Crawler;

namespace LidlCrawler.Instance
{

    public class LidlCrawler : Crawler<LidlProduct>
    {
        private const string CollectionName = "LidlCollection";
        private static readonly ISelector selector = new LidlSelector();

        public LidlCrawler()
            : base(selector, CollectionName) { }
    }
}
