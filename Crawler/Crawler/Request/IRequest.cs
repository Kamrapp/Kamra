namespace Crawler.Request
{
    public interface IRequest
    {
        string Url { get; set; }
        string Regex { get; set; }
        long TimeOut { get; set; }
    }
}
