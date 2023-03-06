namespace MongoDbConnector.Entities;

public class KeyRecord : IDbRecord
{
    public KeyRecord()
    {
        CreatedAt = DateTime.UtcNow;
    }

    public ObjectId Id { get; set; }
    public string Value { get; set; }
    public virtual bool IsValid => !string.IsNullOrEmpty(Key);
    public virtual string Key { get; set; }
    public DateTime CreatedAt { get; set; }
}
