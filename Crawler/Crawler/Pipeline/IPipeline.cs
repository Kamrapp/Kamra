using MongoDB.Driver;

namespace Crawler.Pipeline;

public interface IPipeline<TProduct, TOffer>
    where TProduct : BaseProduct
    where TOffer : BaseOffer
{
    void Run(IEnumerable<TProduct> entities, IEnumerable<TOffer> offers);
    void SetConnection(IMongoDatabase database);
}
