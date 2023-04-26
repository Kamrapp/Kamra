namespace Models.Records.Base;

public interface IBaseRecord
{
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
