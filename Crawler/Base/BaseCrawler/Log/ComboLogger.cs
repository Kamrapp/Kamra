using MongoDB.Driver;

using MongoDbConnector;

namespace BaseCrawler.Log;

public class ComboLogger : BaseLogger, IComboLogger
{
    public override LoggerType LoggerType => LoggerType.Combo;
    private IConsoleLogger ConsoleLogger { get; set; }
    private IFileLogger FileLogger { get; set; }
    private IMongoLogger MongoLogger { get; set; }

    public ComboLogger(string filePath, string logCollection)
    {
        ConsoleLogger = new ConsoleLogger(LogLevel.Debug);
        FileLogger = new FileLogger(LogLevel.Info, filePath);
        MongoLogger = new MongoLogger(LogLevel.Info, logCollection);
    }

    public void SetConnection(IMongoDatabase database)
    {
        MongoLogger.SetConnection(database);
    }

    public override void LogInner(LogType type, string message)
    {
        ConsoleLogger.Log(type, message);
        FileLogger.Log(type, message);
        MongoLogger.Log(type, message);
    }

    public void Log(LoggerType loggerType, LogType type, string message)
    {
        ConsoleLogger.Log(type, message);
        if (loggerType == LoggerType.Console)
            return;

        FileLogger.Log(type, message);
        if (loggerType == LoggerType.File)
            return;

        MongoLogger.Log(type, message);
    }

    public void WrapUp()
    {
        MongoLogger.WrapUp();
    }
}
