namespace Shared.Records;

public interface IBaseRecord
{
    public static string Collection { get; }

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
