using Shared.Utils.Logger;

namespace MongoDbConnector.Records;

public class LogRecord : IDbRecord
{
    public LogRecord()
    {
        CreatedAt = DateTime.Now;
    }

    public ObjectId Id { get; set; }
    public virtual bool IsValid => !string.IsNullOrEmpty(Message);
    public virtual LogType Type { get; set; }
    public virtual string Message { get; set; }
    public DateTime CreatedAt { get; set; }
}
