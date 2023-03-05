using Crawler.Data.Repository;

using HtmlAgilityPack;

namespace Crawler.Process
{
    public interface IProcessor<TEntity> where TEntity : class, IEntity
    {
        TEntity Process(HtmlDocument document, TEntity entity);
    }
}
