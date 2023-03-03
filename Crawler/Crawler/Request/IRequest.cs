namespace Crawler.Request
{
    public interface IRequest
    {
        string Url { get; }
        string Regex { get; }
        int TimeOut { get; }
    }
}
