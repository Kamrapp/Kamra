using MongoDB.Driver;

namespace Crawler.Read;

public interface IReader
{
    public IPage Page { get; set; }
    void SetConnection(IMongoDatabase database);
    public Task<(IEnumerable<string>, IEnumerable<string>)> GetCardsAndLinks();
}
