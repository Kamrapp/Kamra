using System.Runtime.InteropServices;

namespace Crawler.Pipeline;

public class MongoDbPipeline<TEntity> : IPipeline<TEntity> where TEntity : BaseEntity
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
                (bool changed, TEntity newEntity) = existingEntity.UpdateValues(entity);

                if (!changed)
                    continue;

                _service.Update(entity.Key, newEntity);
                continue;
            }

            _service.Create(entity);
            Console.WriteLine($"Item with key {entity.Key} successfully scraped.");
        }


    }
}
