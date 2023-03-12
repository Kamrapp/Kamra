using MongoDbConnector;

namespace Crawler.Log
{
    public interface IComboLogger : IMongoLogger
    {
        public void Log(LoggerType loggerType, LogType type, string message);
    }

}
