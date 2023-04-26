using BaseCrawler;

using Models.Records.Aldi;

namespace AldiCrawler.Instance;

public class AldiCrawler : Crawler<AldiProduct, AldiOffer>
{
    private static readonly ISelector selector = new AldiSelector();

    private const string CrawlerPrefix = "Aldi";

    public AldiCrawler()
        : base(selector, CrawlerPrefix) { }
}