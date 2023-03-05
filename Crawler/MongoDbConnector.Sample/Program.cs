namespace MongoDbConnector.Sample;

class Program
{
    static async Task Main(string[] args)
    {
        var mongoDatabase = MongoDbConnector.InitDatabase();

        if (!MongoDbConnector.TestConnection(mongoDatabase))
            throw new Exception("Test connection could not be initiated");

        //MongoDbConnector.CleanCollection<LidlProduct>(mongoDatabase, "LidlOffers");
    }

}