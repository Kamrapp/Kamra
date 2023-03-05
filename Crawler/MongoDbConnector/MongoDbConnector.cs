using Microsoft.Extensions.Configuration;

using MongoDB.Driver;

namespace MongoDbConnector;

public class MongoDbConnector
{
    public static MongoClient Init()
    {
        var config = new ConfigurationBuilder()
            .SetBasePath(AppDomain.CurrentDomain.BaseDirectory)
            .AddJsonFile("appsettings.json")
            .AddUserSecrets<MongoDbConnector>()
            .Build();

        return Connect(config);
    }

    private static MongoClient Connect(IConfigurationRoot config)
    {
        var secrets = config.GetSection(nameof(MongoDbSecrets)).Get<MongoDbSecrets>();

        Console.WriteLine($"MongoDB: Initiating login as {secrets.Username}");

        //var loginString = $"{secrets.Username}:{secrets.Password}@{secrets.Database}";
        var loginString = $"Barna:Kanklakikon42@kamrapp";

        var settings = MongoClientSettings.FromConnectionString($"mongodb+srv://{loginString}.mgkp1ms.mongodb.net/?retryWrites=true&w=majority");
        settings.ServerApi = new ServerApi(ServerApiVersion.V1);
        var client = new MongoClient(settings);

        var database = client.GetDatabase("test");
        var dbList = client.ListDatabases().ToList();

        Console.WriteLine("The list of databases on this server is: ");
        foreach (var db in dbList)
        {
            Console.WriteLine(db);
        }

        return client;
    }
}
