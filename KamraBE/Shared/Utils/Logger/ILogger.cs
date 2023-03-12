namespace Shared.Utils.Logger
{
    public interface ILogger
    {
        public LoggerType LoggerType { get; }
        public void Log(LogType type, string message);
    }
}
