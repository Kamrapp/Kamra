namespace MongoDbConnector.Repository;

public abstract class GenericService<TEntity> : IGenericService<TEntity> where TEntity : BaseEntity
{
    protected readonly IMongoCollection<TEntity> _items;

    public GenericService(string collectionName)
    {
        var database = MongoDbConnector.InitDatabase();

        _items = database.GetCollection<TEntity>(collectionName);
    }

    public List<TEntity> Get() => _items.Find(item => true).ToList();

    public TEntity Get(ObjectId id) => _items.Find(item => item.Id == id).FirstOrDefault();

    public TEntity Create(TEntity item)
    {
        _items.InsertOne(item);
        return item;
    }

    public void Update(ObjectId id, TEntity updatedItem) => _items.ReplaceOne(item => item.Id == id, updatedItem);

    public void Delete(TEntity itemToDelete) => _items.DeleteOne(item => item.Id == itemToDelete.Id);

    public void Delete(ObjectId id) => _items.DeleteOne(item => item.Id == id);
}
