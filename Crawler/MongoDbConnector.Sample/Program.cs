using MongoDB.Driver;

using MongoDbConnector.Records;

namespace MongoDbConnector.Sample;

class Program
{
    static void Main()
    {
        var database = MongoDbConnector.InitDatabase();

        //if (!MongoDbConnector.TestConnection(database))
        //    throw new Exception("Test connection could not be initiated");

        //MongoDbConnector.CleanCollection<KeyRecord>(database, "Lidl_Links");
    }

    private static readonly IEnumerable<string> shops = new List<string>
    {
        "Lidl",
        "Aldi"
    };

    private static IEnumerable<string> Collections()
    {
        foreach (var shop in shops)
        {
            yield return $"{shop}_OfferCards";
            yield return $"{shop}_Links";
            yield return $"{shop}_Products";
            yield return $"{shop}_Offers";
        }
    }

    // CAREFUL!
#pragma warning disable CS0162 // Unreachable code detected
#pragma warning disable IDE0051 // Remove unused private members
#pragma warning disable IDE0060 // Remove unused parameter
    private static void PurgeDatabase(IMongoDatabase database)
    {
        throw new AccessViolationException("Dont you dare!");
        foreach (var collection in Collections())
        {
            if (database.GetCollection<DbRecord>(collection) != null)
                continue;

            MongoDbConnector.CleanCollection<KeyRecord>(database, collection);
        }
    }
#pragma warning restore CS0162 // Unreachable code detected
#pragma warning restore IDE0051 // Remove unused private members
#pragma warning restore IDE0060 // Remove unused parameter

}