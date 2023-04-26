namespace Shared.Utils.Logger;

public interface IFileLogger : ILogger
{
    void SetFilePath(string filePath);
}
