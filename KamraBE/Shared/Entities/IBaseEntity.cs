namespace Shared.Entities;

public interface IBaseEntity
{
    public static string Collection { get; }

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
