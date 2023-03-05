namespace MongoDbConnector.Repository;

public interface IDbRecord
{
    ObjectId Id { get; }
    public bool IsValid { get; }
}
