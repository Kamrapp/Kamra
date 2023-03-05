using HtmlAgilityPack.CssSelectors.NetCore;

using Newtonsoft.Json.Linq;

namespace Crawler.Helpers;

public static class AttributeHelpers
{
    public static FieldAttribute ToInnerFieldAttribute(this FieldAttribute fieldAttribute) => new FieldAttribute { Expression = fieldAttribute.ChildExpression, Selector = NodeSelector.AttributeSelector, ValueType = fieldAttribute.ValueType };
    public static JsonValueAttribute ToInnerJsonValueAttribute(this JsonValueAttribute jsonValueAttribute) => new JsonValueAttribute { Expression = jsonValueAttribute.ChildExpression, Selector = JTokenSelector.Key, ValueType = jsonValueAttribute.ValueType };

    public static object GetValue(this HtmlNode node, FieldAttribute fieldAttribute)
    {
        switch (fieldAttribute.Selector)
        {
            case NodeSelector.XPath:
                return node.GetValueByXPath(fieldAttribute);
            case NodeSelector.CssSelector:
                return node.GetValueByCSS(fieldAttribute);
            case NodeSelector.AttributeSelector:
                return node.GetValueByAttribute(fieldAttribute);
            case NodeSelector.FixedValue:
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

    public static object GetValue(this JToken jToken, JsonValueAttribute jsonValueAttribute)
    {
        switch (jsonValueAttribute.Selector)
        {
            case JTokenSelector.Key:
                return GetValueByKey(jToken, jsonValueAttribute);
            default:
                break;
        }

        return null;
    }

    public static object GetValueByKey(this JToken jToken, JsonValueAttribute jsonValueAttribute)
    {
        JToken subToken = null;
        try
        {
            //if (jToken[jsonValueAttribute.Expression] is JArray subList)
            //{
            //    subToken = subList[0];
            //}
            //else
            //{
                subToken = jToken[jsonValueAttribute.Expression];
            //}
        }
        catch {}

        if (subToken == null)
            return null;

        return SortValueBySource(subToken, jsonValueAttribute);
    }

    public static object GetValueByChildToken(this JToken jToken, JsonValueAttribute jsonValueAttribute)
    {
        return jToken.First.GetValue(jsonValueAttribute.ToInnerJsonValueAttribute());
    }


    public static object GetValueByType(string stringValue, BasePropertyAttribute propertyAttribute)
    {
        return StringConverter.ConvertStringToObject(stringValue, propertyAttribute.ValueType);
    }

    public static object GetValueByAttribute(this HtmlNode node, FieldAttribute fieldAttribute)
    {
        var nodeAttribute = node.GetAttributeValue(fieldAttribute.ChildExpression, "none_default");
        if (nodeAttribute == null || nodeAttribute.Equals("none_default"))
            return null;

        return GetValueByType(nodeAttribute, fieldAttribute);
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
            case NodeValueSource.InnerText_Clean: return GetValueByType(CleanTextFromHtml(node.InnerText), fieldAttribute);
            case NodeValueSource.InnerText: return GetValueByType(node.InnerText, fieldAttribute);
            case NodeValueSource.InnerHtml: return GetValueByType(node.InnerHtml, fieldAttribute);
            case NodeValueSource.Attribute: return node.GetValueByAttribute(fieldAttribute);
            default: return node.InnerText;
        }
    }

    public static object SortValueBySource(this JToken jToken, JsonValueAttribute jsonValueAttribute)
    {
        switch (jsonValueAttribute.ValueSource)
        {
            case JsonValueSource.Value_Clean: return GetValueByType(CleanTextFromHtml(jToken.Value<string>()), jsonValueAttribute);
            case JsonValueSource.Value: return GetValueByType(jToken.Value<string>(), jsonValueAttribute);
            case JsonValueSource.Value_FirstItem: return GetValueByType(jToken.First.Value<string>(), jsonValueAttribute);
            case JsonValueSource.ChildValue: return jToken.GetValueByChildToken(jsonValueAttribute);
            default: return jToken.Value<string>();
        }
    }

    private static string CleanTextFromHtml(string text)
    {
        text = text.Replace("\n", "");
        text = text.Replace("\r", "");

        text = text.Trim();

        return text;
    }
}
