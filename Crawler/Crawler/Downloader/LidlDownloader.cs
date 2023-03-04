namespace Crawler.Downloader
{
    public class LidlDownloader : BaseDownloader
    {
        protected override string UrlBase => "https://www.lidl.hu";
        public LidlDownloader()
            : base()
        { }
    }
}
