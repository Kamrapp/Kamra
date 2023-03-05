namespace Crawler.Pipeline;

public interface IPipeline<TProductEntity, TOfferEntity>
    where TProductEntity : BaseProduct
    where TOfferEntity : BaseOffer
{
    void Run(IEnumerable<TProductEntity> entities, IEnumerable<TOfferEntity> offers);
}
