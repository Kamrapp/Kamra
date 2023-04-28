using Models.Records.Base;

using MongoDB.Driver;

using MongoDbConnector.Repository;

using Shared.Dtos;
using Shared.Mapper;

using System.Net.Http.Headers;
using System.Net.Http.Json;

namespace Fetcher.Instance
{
    public class Fetcher
    {
        private IComboLogger Logger { get; set; }

        private const string LogCollection = "Fetcher_Logs";
        private const string LidlProductCollection = "Lidl_Products";
        private const string AldiProductCollection = "Aldi_Products";
        private const string LidlOfferCollection = "Lidl_Offers";
        private const string AldiOfferCollection = "Aldi_Offers";
        private static string LogPath => $"KamraFetcher\\Logs\\Fetcher\\log_{DateTime.Now:yyyy_MM_dd__hh_mm_ss}.txt";

        private IBaseRecordRepository<BaseProduct> LidlProductRepository;
        private IBaseRecordRepository<BaseProduct> AldiProductRepository;
        private IBaseRecordRepository<BaseOffer> LidlOfferRepository;
        private IBaseRecordRepository<BaseOffer> AldiOfferRepository;

        private const string ApiEndpoint = "https://localhost:2022/";
        private HttpClient Client;

        public Fetcher()
        {
            Logger = new ComboLogger(LogPath, LogCollection);

            LidlProductRepository = new ProductRepository<BaseProduct>(LidlProductCollection);
            AldiProductRepository = new ProductRepository<BaseProduct>(AldiProductCollection);
            LidlOfferRepository = new OfferRepository<BaseOffer>(LidlOfferCollection);
            AldiOfferRepository = new OfferRepository<BaseOffer>(AldiOfferCollection);
        }

        public async Task Fetch()
        {
            InitFetch();

            Logger.Log(LoggerType.Console, LogType.Info, $"========================================================");
            Logger.Log(LoggerType.Console, LogType.Info, $"      Fetching started at:  {DateTime.Now}");
            Logger.Log(LoggerType.Console, LogType.Info, $"========================================================");
            Logger.Log(LogType.Info, $"Fetching started");

            await FetchProducts();
            await FetchOffers();
        }

        private async Task FetchOffers()
        {
            var filter1 = Builders<BaseOffer>.Filter.Eq(x => x.IsMigrated, false);
            var filter2 = Builders<BaseOffer>.Filter.Eq(x => x.IsFaulted, false);
            var combineFilter = Builders<BaseOffer>.Filter.And(filter1, filter2);

            try
            {
                var lidlOffers = LidlOfferRepository.Get(combineFilter);
                Logger.Log(LogType.Info, $"Fetched {lidlOffers.Count} lidl offer(s).");
                foreach (var lidlOffer in lidlOffers)
                {
                    await UploadOffer(lidlOffer, "Lidl", LidlOfferRepository, LidlProductRepository);
                }

                var aldiOffers = AldiOfferRepository.Get(combineFilter);
                Logger.Log(LogType.Info, $"Fetched {aldiOffers.Count} aldi offer(s).");
                foreach (var aldiOffer in aldiOffers)
                {
                    await UploadOffer(aldiOffer, "Aldi", AldiOfferRepository, AldiProductRepository);
                }
            }
            catch (Exception ex)
            {
                Logger.Log(LogType.Error, $"Fatal error");
            }
        }

        private async Task FetchProducts()
        {
            var filter1 = Builders<BaseProduct>.Filter.Eq(x => x.IsMigrated, false);
            var filter2 = Builders<BaseProduct>.Filter.Eq(x => x.IsFaulted, false);
            var combineFilter = Builders<BaseProduct>.Filter.And(filter1, filter2);

            try
            {
                var lidlProducts = LidlProductRepository.Get(combineFilter);
                Logger.Log(LogType.Info, $"Fetched {lidlProducts.Count} lidl product(s).");
                foreach (var lidlProduct in lidlProducts)
                {
                    await UploadProduct(lidlProduct, "lidl", LidlProductRepository);
                }

                var aldiProducts = AldiProductRepository.Get(combineFilter);
                Logger.Log(LogType.Info, $"Fetched {aldiProducts.Count} aldi product(s).");
                foreach (var aldiProduct in aldiProducts)
                {
                    await UploadProduct(aldiProduct, "aldi", AldiProductRepository);
                }
            }
            catch (Exception ex)
            {
                Logger.Log(LogType.Error, $"Fatal error");
            }
        }

        private static bool ValidateDto(MongoElementDto elementDto)
        {
            if (string.IsNullOrEmpty(elementDto.GlobalName))
                return false;
            if (string.IsNullOrEmpty(elementDto.Url))
                return false;
            if (string.IsNullOrEmpty(elementDto.PictureUri))
                return false;

            return true;
        }

        private static bool ValidateDto(MongoStockDto stockDto)
        {
            if (string.IsNullOrEmpty(stockDto.Url))
                return false;
            if (stockDto.ApiId == null)
                return false;

            return true;
        }
        private async Task UploadOffer(BaseOffer offer, string distributor, IBaseRecordRepository<BaseOffer> repository, IBaseRecordRepository<BaseProduct> productRepository)
        {
            var mongoStockDto = offer.ToMongoDto();
            if (string.IsNullOrEmpty(mongoStockDto.MongoShop))
                mongoStockDto.MongoShop = distributor;

            int? productApiId = GetProductId(productRepository, offer.ProductKey);
            if (productApiId == null)
            {
                Logger.Log(LogType.Info, $"Failed to check  product for offer {offer.ProductKey}");
                return;
            }

            mongoStockDto.ElementId = productApiId;

            if (!ValidateDto(mongoStockDto))
            {
                Logger.Log(LogType.Info, $"Failed to fetch  offer for product {offer.ProductKey}");

                offer.IsFaulted = true;
                repository.Update(offer);
                Logger.Log(LogType.Info, $"Updated  offer for product {offer.ProductKey} in mongoDb faulted");
                return;
            }

            var apiId = await CreateStockAsync(mongoStockDto);
            if (apiId <= 0)
            {
                Logger.Log(LogType.Info, $"Failed to upload offer for product {offer.ProductKey}");
                return;
            }

            Logger.Log(LogType.Info, $"Uploaded offer for product {offer.ProductKey} with given ApiId: {apiId}");

            offer.ApiId = apiId;
            offer.IsMigrated = true;
            offer.MigratedAt = DateTime.Now;
            repository.Update(offer);
            Logger.Log(LogType.Info, $"Updated  offer for product {offer.ProductKey} in mongoDb ApiId: {apiId}");
        }

        private int? GetProductId(IBaseRecordRepository<BaseProduct> productRepository, string productKey)
        {
            int? productApiId;
            try
            {
                var filterProduct = Builders<BaseProduct>.Filter.Eq(x => x.Key, productKey);
                var product = productRepository.Get(filterProduct).Single();

                if (product.IsMigrated == false)
                {
                    //product is not yet migrated
                    return null;
                }

                if (product.ApiId == null)
                {
                    throw new DataMisalignedException("Product is migrated but does not have ApiId");
                }

                productApiId = product.ApiId;
            }
            catch (Exception ex)
            {
                return null;
            }

            return productApiId;
        }
        private async Task UploadProduct(BaseProduct product, string distributor, IBaseRecordRepository<BaseProduct> repository)
        {
            var mongoElementDto = product.ToMongoDto();
            if (string.IsNullOrEmpty(mongoElementDto.Distributor))
                mongoElementDto.Distributor = distributor;

            if (!ValidateDto(mongoElementDto))
            {
                Logger.Log(LogType.Info, $"Failed to fetch  {product.Name}");

                product.IsFaulted = true;
                repository.Update(product);
                Logger.Log(LogType.Info, $"Updated  {product.Name} in mongoDb faulted");
                return;
            }

            var apiId = await CreateElementAsync(mongoElementDto);
            if (apiId <= 0)
            {
                Logger.Log(LogType.Info, $"Failed to upload {product.Name}");
                return;
            }

            Logger.Log(LogType.Info, $"Uploaded {product.Name} with given ApiId: {apiId}");

            product.ApiId = apiId;
            product.IsMigrated = true;
            product.MigratedAt = DateTime.Now;
            repository.Update(product);
            Logger.Log(LogType.Info, $"Updated  {product.Name} in mongoDb ApiId: {apiId}");
        }

        async Task<bool> GetAllElementsAsync()
        {
            HttpResponseMessage response;
            try
            {
                response = await Client.GetAsync("api/element/getall");
            }
            catch (Exception ex)
            {
                return false;
            }

            return true;
        }

        async Task<int?> CreateStockAsync(MongoStockDto stockDto)
        {
            HttpResponseMessage response;
            try
            {
                response = await Client.PostAsJsonAsync(
                "api/stock/create", stockDto);
            }
            catch (Exception ex)
            {
                Logger.Log(LogType.Info, $"Failed to create offer for {stockDto.ElementId}");
                return -1;
            }

            if (response.StatusCode != System.Net.HttpStatusCode.OK)
                return -1;

            var newStockDto = await response.Content.ReadFromJsonAsync<MongoStockDto>();
            return newStockDto.ApiId;
        }

        async Task<int?> CreateElementAsync(MongoElementDto elementDto)
        {
            HttpResponseMessage response;
            try
            {
                response = await Client.PostAsJsonAsync(
                "api/element/create", elementDto);
            }
            catch (Exception ex)
            {
                Logger.Log(LogType.Info, $"Failed to create {elementDto.GlobalName}");
                return -1;
            }

            if (response.StatusCode != System.Net.HttpStatusCode.OK)
                return -1;

            var newElementDto = await response.Content.ReadFromJsonAsync<MongoStockDto>();
            return newElementDto.ApiId;
        }

        private void InitFetch()
        {
            Logger.Log(LoggerType.File, LogType.Debug, $"Initializing Fetcher...");

            InitMongo();
            InitClient();

            Logger.Log(LoggerType.File, LogType.Debug, $"Initialization successful.");
        }

        private void InitMongo()
        {
            var database = MongoDbConnector.MongoDbConnector.InitDatabase();

            Logger.SetConnection(database);

            LidlProductRepository.SetConnection(database);
            AldiProductRepository.SetConnection(database);
            LidlOfferRepository.SetConnection(database);
            AldiOfferRepository.SetConnection(database);
        }

        private void InitClient()
        {
            Client = new HttpClient
            {
                BaseAddress = new Uri(ApiEndpoint),
            };
            Client.DefaultRequestHeaders.Accept.Clear();
            Client.DefaultRequestHeaders.Accept.Add(
                new MediaTypeWithQualityHeaderValue("application/json"));
        }
    }
}
