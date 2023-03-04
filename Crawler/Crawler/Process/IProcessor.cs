using Crawler.Data.Repository;

using HtmlAgilityPack;

using System.Collections.Generic;
using System.Threading.Tasks;

namespace Crawler.Process
{
    public interface IProcessor<TEntity> where TEntity : class, IEntity
    {
        Task<IEnumerable<TEntity>> Process(HtmlDocument document);
    }
}
