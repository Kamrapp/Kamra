namespace Shared.Utils.Logger
{
    public class FileLogger : BaseLogger, IFileLogger
    {
        private static string BasePath => Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
        public override LoggerType LoggerType => LoggerType.File;
        public FileLogger(LogLevel level, string filePath)
            : this(level)
        {
            SetFilePath(filePath);
        }

        public FileLogger(LogLevel level)
            : base(level)
        {
        }

        private string FilePath { get; set; }

        public void SetFilePath(string filePath)
        {
            FilePath = $"{BasePath}\\{filePath}";

            var directoryPath = Path.GetDirectoryName(FilePath);
            if (!Directory.Exists(directoryPath))
            {
                Directory.CreateDirectory(directoryPath);
            }
        }

        public override void LogInner(LogType type, string message)
        {
            using StreamWriter streamWriter = new(FilePath);
            streamWriter.WriteLine($"{DateTime.Now} | {type}: {message}");
            streamWriter.Close();
        }
    }
}
