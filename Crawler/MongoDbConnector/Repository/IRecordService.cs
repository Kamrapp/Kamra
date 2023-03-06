namespace MongoDbConnector.Repository;

public interface IRecordService<TRecord>
    where TRecord : IDbRecord
{
    public void SetConnection(IMongoDatabase database);
    List<TRecord> Get();
    TRecord Get(ObjectId id);
    TRecord Create(TRecord record);
    void Update(ObjectId id, TRecord record);
    void Delete(ObjectId id);
}
