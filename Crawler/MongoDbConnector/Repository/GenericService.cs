namespace MongoDbConnector.Repository;

public class GenericService<TEntity> : IGenericService<TEntity> where TEntity : class, IDbRecord
{
    private readonly IMongoCollection<TEntity> _items;

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

    public void Update(ObjectId id, TEntity updatedItem) => _items.ReplaceOne(game => game.Id == id, updatedItem);

    public void Delete(TEntity itemToDelete) => _items.DeleteOne(game => game.Id == itemToDelete.Id);

    public void Delete(ObjectId id) => _items.DeleteOne(game => game.Id == id);

    public TEntity Get(string key) => _items.Find(item => item.Key == key).FirstOrDefault();

    public void Update(string key, TEntity updatedItem) => _items.ReplaceOne(item => item.Key == key, updatedItem);

    public void Delete(string key) => _items.DeleteOne(item => item.Key == key);
}
