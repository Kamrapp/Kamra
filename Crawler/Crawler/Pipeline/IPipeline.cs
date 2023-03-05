namespace Crawler.Pipeline;

public interface IPipeline<TEntity> where TEntity : BaseEntity
{
    void Run(IEnumerable<TEntity> entities);
}
