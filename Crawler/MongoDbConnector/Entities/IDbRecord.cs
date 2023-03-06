namespace MongoDbConnector.Entities;

public interface IDbRecord
{
    ObjectId Id { get; }
    public bool IsValid { get; }
}
