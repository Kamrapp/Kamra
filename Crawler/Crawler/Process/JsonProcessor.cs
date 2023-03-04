using Crawler.Data.Attributes;
using Crawler.Data.Repository;
using Crawler.Helpers;

using HtmlAgilityPack;

using Microsoft.EntityFrameworkCore.Metadata.Internal;

using Newtonsoft.Json.Linq;

using System.Collections.Generic;
using System.Reflection;

namespace Crawler.Process
{
    public class JsonProcessor<TEntity> : BaseProcessor<TEntity> where TEntity : class, IEntity
    {
        protected override Dictionary<string, object> GetColumnNameValuePairsFromHtml(HtmlDocument document)
        {
            var columnNameValueDictionary = new Dictionary<string, object>();

            var jsonExpression = ReflectionHelper.GetEntityAttributes<TEntity, JsonAttribute>();
            var jsonNode = document.DocumentNode.SelectSingleNode(jsonExpression);

            if (jsonNode == null)
                return null;

            var jsonValue = jsonNode.InnerText;
            dynamic jsonData = JObject.Parse(jsonValue);

            var propertyExpressions = ReflectionHelper.GetPropertyAttributes<TEntity, JsonValueAttribute>();
            foreach (var expression in propertyExpressions)
            {
                var columnName = expression.Key;
                var columnValue = jsonData[expression.Value.Key].ToString();

                columnNameValueDictionary.Add(columnName, columnValue);
            }

            return columnNameValueDictionary;
        }
    }
}
