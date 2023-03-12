// run this once for environment to install PlayWright
//var exitCode = Microsoft.Playwright.Program.Main(new[] { "install" });

var aldiCrawler = new AldiCrawler.Instance.AldiCrawler();
await aldiCrawler.Crawl();

var lidlCrawler = new LidlCrawler.Instance.LidlCrawler();
await lidlCrawler.Crawl();