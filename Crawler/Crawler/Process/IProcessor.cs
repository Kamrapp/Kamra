namespace Crawler.Process;

public interface IProcessor<TEntity> where TEntity : BaseEntity
{
    TEntity Process(HtmlDocument document, TEntity entity);
}
