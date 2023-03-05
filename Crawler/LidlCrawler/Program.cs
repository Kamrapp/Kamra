namespace LidlCrawler;

class Program
{
    static async Task Main(string[] args)
    {
        // run this once at to install PlayWright
        //var exitCode = Microsoft.Playwright.Program.Main(new[] { "install" });

        var crawler = new Instance.LidlCrawler();

        await crawler.Crawl();
    }
}
