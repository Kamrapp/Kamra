using MongoDB.Driver;

namespace Crawler.Pipeline;

public class ProductOfferPipeline<TProduct, TOffer> : IPipeline<TProduct, TOffer>
    where TProduct : BaseProduct
    where TOffer : BaseOffer
{
    private readonly IBaseRecordRepository<TProduct> _productRepository;
    private readonly IOfferRepository<TOffer> _offerRepository;

    public ProductOfferPipeline(string productCollection, string offerCollection)
    {
        _productRepository = new ProductRepository<TProduct>(productCollection);
        _offerRepository = new OfferRepository<TOffer>(offerCollection);
    }

    public void SetConnection(IMongoDatabase database)
    {
        _productRepository.SetConnection(database);
        _offerRepository.SetConnection(database);
    }

    private static bool UpdateRecord<TRecord, TRepository>(TRecord record, TRepository repository)
        where TRecord : BaseRecord
        where TRepository : IRecordRepository<TRecord>
    {
        var existingRecord = repository.Get(record);
        if (existingRecord == null)
            return false;

        (bool changed, TRecord newRecord) = existingRecord.UpdateValues(record);

        if (!changed)
            return true;

        repository.Update(newRecord);
        return true;
    }

    public void Run(IEnumerable<TProduct> productList, IEnumerable<TOffer> offerList)
    {
        foreach (var product in productList)
        {
            if (!product.IsValid)
                continue;

            if (UpdateRecord(product, _productRepository))
                continue;

            _productRepository.Create(product);
            //Console.WriteLine($"Product {product.Key} successfully scraped.");
        }

        foreach (var offer in offerList)
        {
            if (!offer.IsValid)
                continue;

            if (UpdateRecord(offer, _offerRepository))
                continue;

            // Invalidate offers that were valid at the beginning of current timespan
            var offersToInvalidate = _offerRepository.GetValidOffersAtBegin(offer);
            foreach (var offerToInvalidate in offersToInvalidate)
            {
                offerToInvalidate.ValidTo = offer.ValidFrom.AddDays(-1);
                _offerRepository.Update(offerToInvalidate);
            }

            _offerRepository.Create(offer);
            //Console.WriteLine($"Offer for product {offer.ProductKey} successfully scraped.");
        }
    }
}
