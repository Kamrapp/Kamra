using Crawler.Data.Attributes;
using Crawler.Data.Repository;
using Crawler.Helpers;

using HtmlAgilityPack;

using System.Collections.Generic;

namespace Crawler.Process
{
    public abstract class BaseProcessor<TEntity> : IProcessor<TEntity> where TEntity : class, IEntity
    {
        public IEnumerable<TEntity> Process(HtmlDocument document)
        {
            var nameValueDictionary = GetColumnNameValuePairsFromHtml(document);

            var processorEntity = ReflectionHelper.CreateNewEntity<TEntity>();
            foreach (var pair in nameValueDictionary)
            {
                ReflectionHelper.TrySetProperty(processorEntity, pair.Key, pair.Value);
            }

            return new List<TEntity>
            {
                processorEntity as TEntity
            };
        }

        protected abstract Dictionary<string, object> GetColumnNameValuePairsFromHtml(HtmlDocument document);
    }
}
