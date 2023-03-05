namespace Crawler.Pipeline;

public class MongoDbPipeline<TEntity> : IPipeline<TEntity> where TEntity : class, IDbRecord
{
    private IGenericService<TEntity> _service;

    public MongoDbPipeline()
    {
    }

    public MongoDbPipeline<TEntity> WithService(IGenericService<TEntity> service)
    {
        _service = service;
        return this;
    } 

    public void Run(IEnumerable<TEntity> entityList)
    {
        foreach (var entity in entityList)
        {
            if (!entity.IsValid)
                continue;

            var existingEntity = _service.Get(entity.Key);
            if (existingEntity != null)
            {
                Console.WriteLine($"Item with key <{entity.Key}> already exists with id <{existingEntity.Id}>. Skipping...");

                //TODO update item or set new price
                continue;
            }

            _service.Create(entity);
            Console.WriteLine($"Item with key {entity.Key} successfully scraped.");
        }
    }
}
