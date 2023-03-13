using Shared.Utils.Logger;

namespace MongoDbConnector;

public class MongoLogger : BaseLogger, IMongoLogger
{
    public List<LogRecord> Logs { get; set; }
    public override LoggerType LoggerType => LoggerType.MongoDb;

    private readonly IRecordRepository<LogRecord> _logRepository;

    public MongoLogger(LogLevel level, string logCollection)
        : this(level)
    {
        _logRepository = new LogRepository(logCollection);
    }

    public MongoLogger(LogLevel level)
        : base(level)
    {
        Logs = new List<LogRecord>();
    }

    public void SetConnection(IMongoDatabase database)
    {
        _logRepository.SetConnection(database);
    }

    public void WrapUp()
    {
        var message = string.Empty;
        foreach (var log in Logs)
        {
            message += $"{DateTime.Now} | {log.Type.AsText()}: {log.Message}\r\n";
        }

        var collectiveLog = new LogRecord
        {
            Type = LogType.Collective,
            Message = message
        };

        _logRepository.Create(collectiveLog);
    }

    public override void LogInner(LogType type, string message)
    {
        var record = new LogRecord
        {
            Type = type,
            Message = message
        };

        Logs.Add(record);
        //_logRepository.Create(record);
    }
}
