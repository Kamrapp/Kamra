namespace Shared.Utils.Logger
{
    public abstract class BaseLogger : ILogger
    {
        public abstract LoggerType LoggerType { get; }
        public LogLevel Level { get; set; }

        public BaseLogger()
        {
            Level = LogLevel.Debug;
        }

        public BaseLogger(LogLevel level)
        {
            Level = level;
        }

        public bool ShouldLog(LogType type)
        {
            return (int)Level <= (int)type;
        }
        public abstract void LogInner(LogType type, string message);
        public void Log(LogType type, string message)
        {
            if (ShouldLog(type))
            {
                LogInner(type, message);
            }
        }
    }
}
