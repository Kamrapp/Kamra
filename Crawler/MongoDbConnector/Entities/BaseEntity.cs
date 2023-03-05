namespace MongoDbConnector.Entities;

public abstract class BaseEntity : IDbRecord
{
    public static string Collection { get; }
    public BaseEntity()
    {
        CreatedAt = DateTime.UtcNow;
        IsMigrated = false;
        IsFaulted = false;
    }

    public ObjectId Id { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public DateTime? MigratedAt { get; set; }
    public int? MigrationBatchId { get; set; }
    public bool IsMigrated { get; set; }
    public bool IsFaulted { get; set; }

    public abstract bool IsValid { get; }
    public abstract string Key { get; set; }
}
