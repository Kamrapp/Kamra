using Models.Records.Aldi;
using Models.Records.Base;
using Models.Records.Lidl;

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
        private const string LidlCollection = "Lidl_Products";
        private const string AldiCollection = "Aldi_Products";
        private static string LogPath => $"KamraFetcher\\Logs\\Fetcher\\log_{DateTime.Now:yyyy_MM_dd__hh_mm_ss}.txt";

        private IBaseRecordRepository<BaseProduct> LidlRepository;
        private IBaseRecordRepository<BaseProduct> AldiRepository;

        private const string ApiEndpoint = "http://localhost:2022/";
        private HttpClient Client;

        public Fetcher()
        {
            Logger = new ComboLogger(LogPath, LogCollection);

            LidlRepository = new ProductRepository<BaseProduct>(LidlCollection);
            AldiRepository = new ProductRepository<BaseProduct>(AldiCollection);
        }

        public async Task Fetch()
        {
            InitFetch();

            Logger.Log(LoggerType.Console, LogType.Info, $"========================================================");
            Logger.Log(LoggerType.Console, LogType.Info, $"      Fetching started at:  {DateTime.Now}");
            Logger.Log(LoggerType.Console, LogType.Info, $"========================================================");
            Logger.Log(LogType.Info, $"Fetching started");

            var filter = Builders<BaseProduct>.Filter.Eq("IsMigrated", false);

            var lidlProducts = LidlRepository.Get(filter);
            Logger.Log(LogType.Info, $"Fetched {lidlProducts.Count} lidl product(s).");
            foreach (var lidlProduct in lidlProducts)
            {
                await UploadProduct(lidlProduct, "lidl", LidlRepository);
            }

            var aldiProducts = AldiRepository.Get(filter);
            Logger.Log(LogType.Info, $"Fetched {aldiProducts.Count} aldi product(s).");
            foreach (var aldiProduct in aldiProducts)
            {
                await UploadProduct(aldiProduct, "aldi", AldiRepository);
            }
        }

        private async Task UploadProduct(BaseProduct product, string distributor, IBaseRecordRepository<BaseProduct> repository)
        {
            var mongoElementDto = product.ToMongoDto();
            if (string.IsNullOrEmpty(mongoElementDto.Distributor))
                mongoElementDto.Distributor = distributor;

            var apiId = await CreateElementAsync(mongoElementDto);
            if (apiId <= 0)
            {
                Logger.Log(LogType.Info, $"Failed to upload {product.Name}");
                return;
            }

            Logger.Log(LogType.Info, $"Uploaded {product.Name} with given ApiId: {apiId}");

            product.ApiId = apiId;
            repository.Update(product);
            Logger.Log(LogType.Info, $"Updated  {product.Name} in mongoDb ApiId: {apiId}");
        }

        async Task<int?> CreateElementAsync(MongoElementDto elementDto)
        {
            HttpResponseMessage response = await Client.PostAsJsonAsync(
                "api/element/create", elementDto);

            if (response.StatusCode != System.Net.HttpStatusCode.OK)
                return -1;

            var newElementDto = await response.Content.ReadFromJsonAsync<MongoElementDto>();
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

            LidlRepository.SetConnection(database);
            AldiRepository.SetConnection(database);
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
