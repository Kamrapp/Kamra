using Models.Records.Lidl;

namespace Fetcher.Instance
{
    public class Fetcher
    {
        private IComboLogger Logger { get; set; }

        private const string LogCollection = "";
        private const string LidlCollection = "";
        private const string AldiCollection = "";
        private static string LogPath => $"KamraFetcher\\Logs\\Fetcher\\log_{DateTime.Now:yyyy_MM_dd__hh_mm_ss}.txt";

        private IBaseRecordRepository<LidlProduct> lidlRepository;


        public Fetcher()
        {
            Logger = new ComboLogger(LogPath, LogCollection);

        }

        public async Task Fetch()
        {
            await InitFetch();

            Logger.Log(LoggerType.Console, LogType.Info, $"========================================================");
            Logger.Log(LoggerType.Console, LogType.Info, $"      Fetching started at:  {DateTime.Now}");
            Logger.Log(LoggerType.Console, LogType.Info, $"========================================================");
            Logger.Log(LogType.Info, $"Fetching started");

        }

        public async Task InitFetch()
        {
            Logger.Log(LoggerType.File, LogType.Debug, $"Initializing Fetcher...");

            InitDatabase();

            Logger.Log(LoggerType.File, LogType.Debug, $"Initialization successful.");
        }

        private void InitDatabase()
        {
            var database = MongoDbConnector.MongoDbConnector.InitDatabase();

            Logger.SetConnection(database);
        }
    }
}
