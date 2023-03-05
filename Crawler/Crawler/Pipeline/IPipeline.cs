namespace Crawler.Pipeline;

public interface IPipeline<TEntity> where TEntity : class, IDbRecord
{
    void Run(IEnumerable<TEntity> entities);
}
