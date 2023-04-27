namespace Shared.Utils.Logger;

public class ConsoleLogger : BaseLogger, IConsoleLogger
{
    public override LoggerType LoggerType => LoggerType.Console;
    public ConsoleLogger(LogLevel level)
    : base(level)
    { }

    public override void LogInner(LogType type, string message)
    {
        Console.WriteLine($"{DateTime.Now} | {type,6}: {message}");
    }
}
