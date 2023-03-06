namespace MongoDbConnector.Records;

public abstract class BaseRecord : KeyRecord, IBaseRecord
{
    public static string Collection { get; }
    public BaseRecord()
        : base()
    {
        IsMigrated = false;
        IsFaulted = false;
    }

    public DateTime? UpdatedAt { get; set; }
    public DateTime? MigratedAt { get; set; }
    public int? MigrationBatchId { get; set; }
    public bool IsMigrated { get; set; }
    public bool IsFaulted { get; set; }
}
