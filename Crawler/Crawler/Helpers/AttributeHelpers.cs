using Crawler.Data.Attributes;

using HtmlAgilityPack;
using HtmlAgilityPack.CssSelectors.NetCore;

namespace Crawler.Helpers
{
    public static class AttributeHelpers
    {
        public static FieldAttribute ToInnerFieldAttribute(this FieldAttribute fieldAttribute) => new FieldAttribute { Expression = fieldAttribute.ValueExpression, SelectorType = SelectorType.AttributeSelector, ValueType = fieldAttribute.ValueType };

        public static object GetValue(this HtmlNode node, FieldAttribute fieldAttribute)
        {
            switch (fieldAttribute.SelectorType)
            {
                case SelectorType.XPath:
                    return node.GetValueByXPath(fieldAttribute);
                case SelectorType.CssSelector:
                    return node.GetValueByCSS(fieldAttribute);
                case SelectorType.AttributeSelector:
                    return node.GetValueByAttribute(fieldAttribute);
                case SelectorType.FixedValue:
                    if (int.TryParse(fieldAttribute.Expression, out var result))
                    {
                        return result;
                    }
                    break;
                default:
                    break;
            }

            return null;
        }

        public static object GetValueByAttribute(this HtmlNode node, FieldAttribute fieldAttribute)
        {
            object value = null;

            var nodeAttribute = node.GetAttributeValue(fieldAttribute.Expression, "none_default");
            if (nodeAttribute == null || nodeAttribute.Equals("none_default"))
                return null;

            switch (fieldAttribute.ValueType)
            {
                case AttributeValueType.Int32:
                    if (int.TryParse(nodeAttribute, out var result2))
                    {
                        value = result2;
                    }
                    break;
                case AttributeValueType.Decimal:
                    if (decimal.TryParse(nodeAttribute, out var result3))
                    {
                        value = result3;
                    }
                    break;
                case AttributeValueType.String:
                    value = nodeAttribute;
                    break;
                default:
                    break;
            }

            return value;
        }
        public static object GetValueByXPath(this HtmlNode node, FieldAttribute fieldAttribute)
        {
            var subNode = node.SelectSingleNode(fieldAttribute.Expression);
            if (subNode == null)
                return null;

            return SortValueBySource(subNode, fieldAttribute);
        }
        public static object GetValueByCSS(this HtmlNode node, FieldAttribute fieldAttribute)
        {
            var nodeCss = node.QuerySelector(fieldAttribute.Expression);
            if (nodeCss == null)
                return null;

            return SortValueBySource(nodeCss, fieldAttribute);
        }

        public static object SortValueBySource(this HtmlNode node, FieldAttribute fieldAttribute)
        {
            switch (fieldAttribute.ValueSource)
            {
                case ValueSource.InnerText_Clean: return CleanInnerText(node.InnerText);
                case ValueSource.InnerText: return node.InnerText;
                //case ValueSource.InnerText_LidlScriptValues: return node.InnerText;
                case ValueSource.InnerHtml: return node.InnerHtml;
                case ValueSource.Attribute: return GetValueByAttribute(node, fieldAttribute.ToInnerFieldAttribute());
                default: return node.InnerText;
            }
        }

        private static string CleanInnerText(string innerText)
        {
            innerText = innerText.Replace("\n", "");
            innerText = innerText.Replace("\r", "");

            innerText = innerText.Trim();

            return innerText;
        }
    }
}
