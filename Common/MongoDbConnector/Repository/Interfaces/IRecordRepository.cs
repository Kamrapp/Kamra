namespace MongoDbConnector.Repository.Interfaces;

public interface IRecordRepository<TRecord>
    where TRecord : IDbRecord
{
    public void SetConnection(IMongoDatabase database);

    List<TRecord> Get(FilterDefinition<TRecord> filter);
    TRecord Create(TRecord record);
    TRecord Get(TRecord record);
    TRecord Get(ObjectId id);
    void Update(TRecord record);
    void Update(ObjectId id, TRecord record);
    void Delete(TRecord record);
    void Delete(ObjectId id);
}
