namespace MongoDbConnector.Repository;

public abstract class RecordService<TRecord> : IRecordService<TRecord> where TRecord : IDbRecord
{
    protected readonly IMongoCollection<TRecord> _records;

    public RecordService(IMongoDatabase database, string collectionName)
    {
        _records = database.GetCollection<TRecord>(collectionName);
    }

    public List<TRecord> Get() => _records.Find(record => true).ToList();

    public TRecord Get(ObjectId id) => _records.Find(record => record.Id == id).FirstOrDefault();

    public TRecord Create(TRecord record)
    {
        _records.InsertOne(record);
        return record;
    }

    public void Update(ObjectId id, TRecord updatedItem) => _records.ReplaceOne(record => record.Id == id, updatedItem);

    public void Delete(TRecord recordToDelete) => _records.DeleteOne(record => record.Id == recordToDelete.Id);

    public void Delete(ObjectId id) => _records.DeleteOne(record => record.Id == id);
}
