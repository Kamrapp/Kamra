using MongoDbConnector.Records;

namespace MongoDbConnector.Sample;

class Program
{
    static void Main()
    {
        var mongoDatabase = MongoDbConnector.InitDatabase();

        if (!MongoDbConnector.TestConnection(mongoDatabase))
            throw new Exception("Test connection could not be initiated");

        //MongoDbConnector.CleanCollection<KeyRecord>(mongoDatabase, "Lidl_Links");
    }

}