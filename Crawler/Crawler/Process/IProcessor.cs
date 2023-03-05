namespace Crawler.Process;

public interface IProcessor<TProductEntity, TOfferEntity>
    where TProductEntity : BaseProduct
    where TOfferEntity : BaseOffer
{
    (TProductEntity, TOfferEntity) Process(HtmlDocument document, TProductEntity entity, TOfferEntity offer);
}
