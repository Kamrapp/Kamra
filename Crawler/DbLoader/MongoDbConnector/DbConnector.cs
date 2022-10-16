using Microsoft.Extensions.Configuration;

using MongoDB.Driver;

namespace MongoDbConnector;

public static class DbConnector
{
    public static MongoClient Connect(IConfigurationRoot config)
    {
        var secrets = config.GetSection(nameof(MongoDbSecrets)).Get<MongoDbSecrets>();

        Console.WriteLine($"MongoDB: Initiating login as {secrets.Username}");

        var settings = MongoClientSettings.FromConnectionString($"mongodb+srv://{secrets.Username}:{secrets.Password}@{secrets.Database}.mgkp1ms.mongodb.net/?retryWrites=true&w=majority");
        settings.ServerApi = new ServerApi(ServerApiVersion.V1);
        var client = new MongoClient(settings);

        var dbList = client.ListDatabases().ToList();

        Console.WriteLine("The list of databases on this server is: ");
        foreach (var db in dbList)
        {
            Console.WriteLine(db);
        }

        return client;
    }
}
