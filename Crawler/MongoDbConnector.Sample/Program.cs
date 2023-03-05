namespace MongoDbConnector.Sample;

class Program
{
    static async Task Main(string[] args)
    {
        var mongoDatabase = MongoDbConnector.InitDatabase();
        var mongoClient = MongoDbConnector.TestConnection(mongoDatabase);
    }

}