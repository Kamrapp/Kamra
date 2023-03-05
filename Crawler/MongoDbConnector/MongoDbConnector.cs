namespace MongoDbConnector;

public static class MongoDbConnector
{
    public static IMongoDatabase InitDatabase()
    {
        BuildDatabaseSettings();

        var settings = MongoClientSettings.FromConnectionString(databaseSettings.ConnectionString);
        settings.ServerApi = new ServerApi(ServerApiVersion.V1);
        var client = new MongoClient(settings);

        return client.GetDatabase(databaseSettings.DatabaseName);
    }

    public static bool TestConnection(IMongoDatabase database)
    {
        // test connection
        try
        {
            var collection = database.GetCollection<TestEntity>(databaseSettings.CollectionName);
            foreach (var item in collection.Find(item => true).ToList())
            {
                Console.WriteLine(item.value);
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine(ex.ToString());
            return false;
        }

        return true;
    }

    private static DatabaseSettings databaseSettings { get; set; }

    private static DatabaseSettings BuildDatabaseSettings()
    {
        var configuration = new ConfigurationBuilder()
            .SetBasePath(AppDomain.CurrentDomain.BaseDirectory)
            .AddJsonFile("appsettings.json")
            .AddUserSecrets<MongoDbSecrets>()
            .Build();

        var secrets = configuration.GetSection(nameof(MongoDbSecrets)).Get<MongoDbSecrets>();

        Console.WriteLine($"MongoDB: Initiating login as {secrets.Username}");
        var connectionString = $"mongodb+srv://{secrets.ConnectionData}.mongodb.net/?retryWrites=true&w=majority";

        databaseSettings = new DatabaseSettings
        {
            ConnectionString = connectionString,
            DatabaseName = secrets.DatabaseName,
            CollectionName = secrets.CollectionName
        };

        return databaseSettings;
    }
}
