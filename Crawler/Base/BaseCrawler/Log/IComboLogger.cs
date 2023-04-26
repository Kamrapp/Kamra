using MongoDbConnector;

namespace BaseCrawler.Log;

public interface IComboLogger : IMongoLogger
{
    public void Log(LoggerType loggerType, LogType type, string message);
}
