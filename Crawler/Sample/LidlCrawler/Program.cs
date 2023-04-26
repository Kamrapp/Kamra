namespace LidlCrawler;

class Program
{
    static async Task Main()
    {
        // run this once for environment to install PlayWright
        //var exitCode = Microsoft.Playwright.Program.Main(new[] { "install" });

        var crawler = new Instance.LidlCrawler();

        await crawler.Crawl();
    }
}
