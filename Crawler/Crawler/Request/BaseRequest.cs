namespace Crawler.Request
{
    public class BaseRequest : IRequest
    {
        public string Url { get; set; }
        public string Regex { get; set; }
        public long TimeOut { get; set; }
    }
}
