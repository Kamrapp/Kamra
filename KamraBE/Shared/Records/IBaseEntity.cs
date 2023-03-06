namespace Shared.Records;

public interface IBaseRecord
{
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
