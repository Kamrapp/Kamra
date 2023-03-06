namespace Shared.Entities;

public abstract class BaseEntity : KeyRecord, IBaseEntity
{
    public static string Collection { get; }
    public BaseEntity()
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
