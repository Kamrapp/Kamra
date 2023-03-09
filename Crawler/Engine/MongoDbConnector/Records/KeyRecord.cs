namespace MongoDbConnector.Records;

public class KeyRecord : IDbRecord
{
    public KeyRecord()
    {
        CreatedAt = DateTime.Now;
    }

    public ObjectId Id { get; set; }
    public virtual bool IsValid => !string.IsNullOrEmpty(Key);
    public virtual string Key { get; set; }
    public DateTime CreatedAt { get; set; }
}
