using Shared.Utils.Logger;

namespace MongoDbConnector
{
    public interface IMongoLogger : ILogger
    {
        void SetConnection(IMongoDatabase database);
    }
}
