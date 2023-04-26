namespace MongoDbConnector.Records;

public class DbRecord : IDbRecord
{
    public DbRecord()
    {
    }

    public ObjectId Id { get; set; }
    public virtual bool IsValid => true;
}
