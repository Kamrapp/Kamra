namespace MongoDbConnector.Log;

public interface IMongoLogger : ILogger
{
    void SetConnection(IMongoDatabase database);
    void WrapUp();
}
