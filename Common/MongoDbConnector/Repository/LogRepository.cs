namespace MongoDbConnector.Repository;

public class LogRepository : RecordRepository<LogRecord>
{
    public LogRepository(string collectionName)
        : base(collectionName)
    {
    }
}
