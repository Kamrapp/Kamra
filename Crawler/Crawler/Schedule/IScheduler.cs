namespace Crawler.Schedule;

public interface IScheduler
{
    long RetryTime { get; set; }
    Task Schedule();
}