namespace Shared.Records.Base;

public interface IDbRecord
{
    ObjectId Id { get; }
    public bool IsValid { get; }
}
