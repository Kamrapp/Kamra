using MongoDB.Driver;

namespace Crawler.Pipeline;

public class MongoDbPipeline<TProductEntity, TOfferEntity> : IPipeline<TProductEntity, TOfferEntity> 
    where TProductEntity : BaseProduct
    where TOfferEntity : BaseOffer
{
    private IProductService<TProductEntity> _productService;
    private IOfferService<TOfferEntity> _offerService;

    public MongoDbPipeline()
    {
    }

    public MongoDbPipeline<TProductEntity, TOfferEntity> WithServices(IProductService<TProductEntity> productService, IOfferService<TOfferEntity> offerService)
    {
        _productService = productService;
        _offerService = offerService;
        return this;
    } 

    public void Run(IEnumerable<TProductEntity> productList, IEnumerable<TOfferEntity> offerList)
    {
        foreach (var product in productList)
        {
            if (!product.IsValid)
                continue;

            var existingProduct = _productService.Get(product.Key);
            if (existingProduct != null)
            {
                (bool changed, TProductEntity newProduct) = existingProduct.UpdateValues(product);

                if (!changed)
                    continue;

                _productService.Update(product.Key, newProduct);
                continue;
            }

            _productService.Create(product);
            Console.WriteLine($"Product with key {product.Key} successfully scraped.");
        }

        foreach (var offer in offerList)
        {
            if (!offer.IsValid)
                continue;

            var existingOffer = _offerService.Get(offer.ProductKey, offer.ValidFrom, offer.ValidTo);
            if (existingOffer != null)
            {
                (bool changed, TOfferEntity newOffer) = existingOffer.UpdateValues(offer);

                if (!changed)
                    continue;

                _offerService.Update(offer.ProductKey, offer.ValidFrom, offer.ValidTo, newOffer);
                continue;
            }

            _offerService.Create(offer);
            Console.WriteLine($"Offer for product {offer.ProductKey} successfully scraped.");
        }
    }
}
