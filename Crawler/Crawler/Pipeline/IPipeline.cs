using Crawler.Data.Repository;

using System.Collections.Generic;
using System.Threading.Tasks;

namespace Crawler.Pipeline
{
    public interface IPipeline<TEntity> where TEntity : class, IEntity
    {
        Task Run(IEnumerable<TEntity> entity);
    }
}
