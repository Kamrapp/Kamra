namespace MongoDbConnector.Repository;

public class ProductService<TEntity> : GenericService<TEntity>, IProductService<TEntity>
    where TEntity : BaseProduct
{
    public ProductService(string collectionName)
        : base(collectionName)
        {
        }

    public TEntity Get(string key) => _items.Find(item => item.Key == key).FirstOrDefault();

    public void Update(string key, TEntity updatedItem)
    {
        updatedItem.UpdatedAt = DateTime.UtcNow;
        _items.ReplaceOne(item => item.Key == key, updatedItem);
    }

    public void Delete(string key) => _items.DeleteOne(item => item.Key == key);
}
