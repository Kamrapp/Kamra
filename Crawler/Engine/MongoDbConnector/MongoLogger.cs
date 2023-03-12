using Shared.Utils.Logger;

namespace MongoDbConnector
{
    public class MongoLogger : BaseLogger, IMongoLogger
    {
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
        }

        public void SetConnection(IMongoDatabase database)
        {
            _logRepository.SetConnection(database);
        }

        public override void LogInner(LogType type, string message)
        {
            var record = new LogRecord
            {
                Type = type,
                Message = message
            };

            _logRepository.Create(record);
        }
    }
}
