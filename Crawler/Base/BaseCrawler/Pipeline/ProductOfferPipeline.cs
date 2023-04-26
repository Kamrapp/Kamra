using MongoDB.Driver;

namespace BaseCrawler.Pipeline;

public class ProductOfferPipeline<TProduct, TOffer> : IPipeline<TProduct, TOffer>
    where TProduct : BaseProduct
    where TOffer : BaseOffer
{
    private IComboLogger Logger { get; }

    private readonly IBaseRecordRepository<TProduct> _productRepository;
    private readonly IOfferRepository<TOffer> _offerRepository;

    public ProductOfferPipeline(string productCollection, string offerCollection, IComboLogger logger)
    {
        _productRepository = new ProductRepository<TProduct>(productCollection);
        _offerRepository = new OfferRepository<TOffer>(offerCollection);
        Logger = logger;
    }

    public void SetConnection(IMongoDatabase database)
    {
        _productRepository.SetConnection(database);
        _offerRepository.SetConnection(database);
    }

    private bool UpdateRecord<TRecord, TRepository>(TRecord record, TRepository repository)
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

        if (newRecord is BaseProduct product)
        {
            Logger.Log(LogType.Info, $"Updated product: {product.Key} ({product.Id})");
        }
        else if (newRecord is BaseOffer offer)
        {
            Logger.Log(LogType.Info, $"Updated offer: for {offer.ProductKey} [{offer.ValidFrom} - {offer.ValidTo}] ({offer.Id})");
        }

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

            var createdProduct = _productRepository.Create(product);
            Logger.Log(LogType.Info, $"Created product: {createdProduct.Key} ({createdProduct.Id})");
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
                Logger.Log(LogType.Info, $"Invalidating offer: for {offerToInvalidate.ProductKey} [{offerToInvalidate.ValidFrom} - {offerToInvalidate.ValidTo}] ({offer.Id})...");
                Logger.Log(LogType.Info, $"New validity: [{offerToInvalidate.ValidFrom} - {offerToInvalidate.ValidTo}]");
                _offerRepository.Update(offerToInvalidate);
            }

            var newOffer = _offerRepository.Create(offer);
            Logger.Log(LogType.Info, $"Created offer: for {newOffer.ProductKey} [{newOffer.ValidFrom} - {newOffer.ValidTo}] ({newOffer.Id})");
        }
    }
}
