namespace MongoDbConnector;

public static class MongoDbConnector
{
    public static IMongoDatabase InitDatabase()
    {
        BuildDatabaseSettings();

        var settings = MongoClientSettings.FromConnectionString(DatabaseSettings.ConnectionString);
        settings.ServerApi = new ServerApi(ServerApiVersion.V1);
        var client = new MongoClient(settings);

        return client.GetDatabase(DatabaseSettings.DatabaseName);
    }

    public static bool TestConnection(IMongoDatabase database)
    {
        // test connection
        try
        {
            Console.WriteLine($"Testing DB connection...");
            var collection = database.GetCollection<TestRecord>(DatabaseSettings.CollectionName);
            foreach (var record in collection.Find(item => true).ToList())
            {
                Console.WriteLine(record.Value);
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"DB connection test FAILED with Exception:");
            Console.WriteLine(ex.ToString());
            return false;
        }

        Console.WriteLine($"DB connection test SUCCESSFUL");
        return true;
    }

    public static bool CleanCollection<TRecord>(IMongoDatabase database, string collectionName)
        where TRecord : IDbRecord
    {
        try
        {
            Console.WriteLine($"Cleaning DB collection <{collectionName}>...");
            var collection = database.GetCollection<TRecord>(collectionName);
            collection.DeleteMany(record => true);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"DB collection clearing FAILED with Exception:");
            Console.WriteLine(ex.ToString());
            return false;
        }

        Console.WriteLine($"DB collection cleared SUCCESSFULLY");
        return true;
    }

    private static DatabaseSettings DatabaseSettings { get; set; }

    private static DatabaseSettings BuildDatabaseSettings()
    {
        var configuration = new ConfigurationBuilder()
            .SetBasePath(AppDomain.CurrentDomain.BaseDirectory)
            .AddJsonFile("appsettings.json")
            .AddUserSecrets<MongoDbSecrets>()
            .Build();

        var secrets = configuration.GetSection(nameof(MongoDbSecrets)).Get<MongoDbSecrets>();
        Console.WriteLine($"{DateTime.Now} |MongoDB: Initiating login as {secrets.Username}");
        var connectionString = $"mongodb+srv://{secrets.ConnectionData}.mongodb.net/?retryWrites=true&w=majority";

        DatabaseSettings = new DatabaseSettings
        {
            ConnectionString = connectionString,
            DatabaseName = secrets.DatabaseName,
            CollectionName = secrets.CollectionName
        };

        return DatabaseSettings;
    }
}
