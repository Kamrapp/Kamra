namespace MongoDbConnector.Records;

public interface IDbRecord
{
    ObjectId Id { get; }
    public bool IsValid { get; }
}
