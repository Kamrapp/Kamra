namespace Crawler.Process;

public interface IProcessor<TEntity> where TEntity : class, IDbRecord
{
    TEntity Process(HtmlDocument document, TEntity entity);
}
