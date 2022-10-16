
using System.Threading.Tasks;

namespace Crawler.Scheduler
{
    public interface IScheduler
    {
        long RetryTime { get; set; }
        Task Schedule();
    }
}
