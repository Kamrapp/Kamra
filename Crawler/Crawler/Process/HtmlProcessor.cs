using Crawler.Data.Attributes;
using Crawler.Data.Repository;
using Crawler.Helpers;

using HtmlAgilityPack;

using System.Collections.Generic;

namespace Crawler.Process
{
    public class HtmlProcessor<TEntity> : BaseProcessor<TEntity>
        where TEntity : class, IEntity
    {
        protected override Dictionary<string, object> GetColumnNameValuePairsFromHtml(HtmlDocument document)
        {
            var columnNameValueDictionary = new Dictionary<string, object>();

            var entityExpression = ReflectionHelper.GetEntityAttributes<TEntity, EntityAttribute>();
            var entityNode = document.DocumentNode.SelectSingleNode(entityExpression);

            var propertyExpressions = ReflectionHelper.GetPropertyAttributes<TEntity, FieldAttribute>();
            foreach (var expression in propertyExpressions)
            {
                var columnName = expression.Key;
                object columnValue = entityNode?.GetValue(expression.Value);

                columnNameValueDictionary.Add(columnName, columnValue);
            }

            return columnNameValueDictionary;
        }
    }
}
