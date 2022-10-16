using System.Threading.Tasks;

namespace Crawler
{
    public interface ICrawler
    {
        Task Crawl();
    }
}
