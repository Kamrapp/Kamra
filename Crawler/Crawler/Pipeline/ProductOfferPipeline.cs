using MongoDB.Driver;

namespace Crawler.Pipeline;

public class ProductOfferPipeline<TProduct, TOffer> : IPipeline<TProduct, TOffer>
    where TProduct : BaseProduct
    where TOffer : BaseOffer
{
    private IKeyRecordService<TProduct> _productService;
    private IOfferService<TOffer> _offerService;

    public ProductOfferPipeline()
    {
    }

    public ProductOfferPipeline<TProduct, TOffer> WithServices(IKeyRecordService<TProduct> productService, IOfferService<TOffer> offerService)
    {
        _productService = productService;
        _offerService = offerService;
        return this;
    }

    public void SetConnection(IMongoDatabase database)
    {
        _productService.SetConnection(database);
        _offerService.SetConnection(database);
    }

    public void Run(IEnumerable<TProduct> productList, IEnumerable<TOffer> offerList)
    {
        foreach (var product in productList)
        {
            if (!product.IsValid)
                continue;

            var existingProduct = _productService.Get(product.Key);
            if (existingProduct != null)
            {
                (bool changed, TProduct newProduct) = existingProduct.UpdateValues(product);

                if (!changed)
                    continue;

                _productService.Update(product.Key, newProduct);
                continue;
            }

            _productService.Create(product);
            //Console.WriteLine($"Product with key {product.Key} successfully scraped.");
        }

        foreach (var offer in offerList)
        {
            if (!offer.IsValid)
                continue;

            var existingOffer = _offerService.Get(offer.ProductKey, offer.ValidFrom, offer.ValidTo);
            if (existingOffer != null)
            {
                (bool changed, TOffer newOffer) = existingOffer.UpdateValues(offer);

                if (!changed)
                    continue;

                _offerService.Update(offer.ProductKey, offer.ValidFrom, offer.ValidTo, newOffer);
                continue;
            }

            _offerService.Create(offer);
            //Console.WriteLine($"Offer for product {offer.ProductKey} successfully scraped.");
        }
    }
}
