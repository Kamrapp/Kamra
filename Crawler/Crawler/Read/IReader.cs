namespace Crawler.Read;

public interface IReader
{
    public IPage Page { get; set; }
    public Task<IEnumerable<string>> GetLinks();
}
