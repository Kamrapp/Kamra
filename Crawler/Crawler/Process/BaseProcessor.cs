using Crawler.Data.Attributes;
using Crawler.Data.Repository;
using Crawler.Helpers;
using Crawler.Process;

using HtmlAgilityPack;
using HtmlAgilityPack.CssSelectors.NetCore;

using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Crawler.Process
{
    public class BaseProcessor<TEntity> : IProcessor<TEntity> where TEntity : class, IEntity
    {
        public async Task<IEnumerable<TEntity>> Process(HtmlDocument document)
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

        private static Dictionary<string, object> GetColumnNameValuePairsFromHtml(HtmlDocument document)
        {
            var columnNameValueDictionary = new Dictionary<string, object>();

            var entityExpression = ReflectionHelper.GetEntityExpression<TEntity>();
            var propertyExpressions = ReflectionHelper.GetPropertyAttributes<TEntity>();

            var entityNode = document.DocumentNode.SelectSingleNode(entityExpression);

            foreach (var expression in propertyExpressions)
            {
                var columnName = expression.Key;
                object columnValue = null;
                var (selectorType, valueType, fieldExpression) = expression.Value;

                switch (selectorType)
                {
                    case SelectorType.XPath:
                        var node = entityNode.SelectSingleNode(fieldExpression);
                        if (node != null)
                            columnValue = node.InnerText;
                        break;
                    case SelectorType.CssSelector:
                        var nodeCss = entityNode.QuerySelector(fieldExpression);
                        if (nodeCss != null)
                            columnValue = nodeCss.InnerText;
                        break;
                    case SelectorType.AttributeSelector:
                        var nodeAttribute = entityNode.GetAttributeValue(fieldExpression, "none_default");
                        if (nodeAttribute != null && !nodeAttribute.Equals("none_default"))
                        {
                            switch (valueType)
                            {
                                case AttributeValueType.Int32:
                                    if (int.TryParse(nodeAttribute, out var result2))
                                    {
                                        columnValue = result2;
                                    }
                                    break;
                                case AttributeValueType.Decimal:
                                    if (decimal.TryParse(nodeAttribute, out var result3))
                                    {
                                        columnValue = result3;
                                    }
                                    break;
                                case AttributeValueType.String:
                                    columnValue = nodeAttribute;
                                    break;
                                default:
                                    break;
                            }
                        }
                        break;
                    case SelectorType.FixedValue:
                        if (int.TryParse(fieldExpression, out var result))
                        {
                            columnValue = result;
                        }
                        break;
                    default:
                        break;
                }
                columnNameValueDictionary.Add(columnName, columnValue);
            }

            return columnNameValueDictionary;
        }
    }
}
