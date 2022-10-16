using Crawler.Pipeline;
using Crawler.Data.Repository;

using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Crawler.Pipeline
{
    public class BasePipeline<TEntity> : IPipeline<TEntity> where TEntity : class, IEntity
    {
        private readonly IGenericRepository<TEntity> _repository;

        public BasePipeline()
        {
            _repository = new GenericRepository<TEntity>();
        }

        public async Task Run(IEnumerable<TEntity> entityList)
        {
            foreach (var entity in entityList)
            {
                if (!entity.IsValid)
                    continue;

                if (_repository.GetById(entity.Id) != null)
                {
                    Console.WriteLine($"Item with id {entity.Id} already exists. Skipping...");

                    //TODO update item or set new price
                    continue;
                }

                await _repository.CreateAsync(entity);
                Console.WriteLine($"Item with id {entity.Id} successfully scraped.");
            }
        }
    }
}
