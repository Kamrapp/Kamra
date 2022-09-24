using Microsoft.Extensions.Configuration;

using Shared.Utils.MongoDbConnector;

namespace MongoDBConnector;
public class Program
{
    public static IConfigurationRoot Configuration { get; set; }

    private static void Main()
    {
        var config = new ConfigurationBuilder()
            .SetBasePath(AppDomain.CurrentDomain.BaseDirectory)
            .AddJsonFile("appsettings.json")
            .AddUserSecrets<Program>()
            .Build();

        var client = DbConnector.Connect(config);

    }
}