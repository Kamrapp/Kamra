using HtmlAgilityPack.CssSelectors.NetCore;

using Newtonsoft.Json.Linq;

namespace Crawler.Helpers;

public static class AttributeHelpers
{
    public static HtmlPropertyAttribute ToInnerHtmlPropertyAttribute(this HtmlPropertyAttribute htmlPropertyAttribute) => new() { Expression = htmlPropertyAttribute.ChildExpression, Selector = NodeSelector.AttributeSelector, ValueType = htmlPropertyAttribute.ValueType };
    public static JsonValueAttribute ToInnerJsonValueAttribute(this JsonValueAttribute jsonValueAttribute) => new() { Expression = jsonValueAttribute.ChildExpression, Selector = JTokenSelector.Key, ValueType = jsonValueAttribute.ValueType };

    public static object GetValue(this HtmlNode node, HtmlPropertyAttribute htmlPropertyAttribute)
    {
        switch (htmlPropertyAttribute.Selector)
        {
            case NodeSelector.XPath:
                return node.GetValueByXPath(htmlPropertyAttribute);
            case NodeSelector.CssSelector:
                return node.GetValueByCSS(htmlPropertyAttribute);
            case NodeSelector.AttributeSelector:
                return node.GetValueByAttribute(htmlPropertyAttribute);
            case NodeSelector.FixedValue:
                if (int.TryParse(htmlPropertyAttribute.Expression, out var result))
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
        catch { }

        if (subToken == null)
            return null;

        return SortValueBySource(subToken, jsonValueAttribute);
    }

    public static object GetValueByChildToken(this JToken jToken, JsonValueAttribute jsonValueAttribute)
    {
        return jToken.First.GetValue(jsonValueAttribute.ToInnerJsonValueAttribute());
    }

    public static object GetValueByChildKey(this JToken jToken, JsonValueAttribute jsonValueAttribute)
    {
        return jToken.GetValueByKey(jsonValueAttribute.ToInnerJsonValueAttribute());
    }


    public static object GetValueByType(string stringValue, BasePropertyAttribute propertyAttribute)
    {
        return StringConverter.ConvertStringToObject(stringValue, propertyAttribute.ValueType);
    }

    public static object GetValueByAttribute(this HtmlNode node, HtmlPropertyAttribute htmlPropertyAttribute)
    {
        var nodeAttribute = node.GetAttributeValue(htmlPropertyAttribute.Expression, "none_default");
        if (nodeAttribute == null || nodeAttribute.Equals("none_default"))
            return null;

        return GetValueByType(nodeAttribute, htmlPropertyAttribute);
    }
    public static object GetValueByXPath(this HtmlNode node, HtmlPropertyAttribute htmlPropertyAttribute)
    {
        var subNode = node.SelectSingleNode(htmlPropertyAttribute.Expression);
        if (subNode == null)
            return null;

        return SortValueBySource(subNode, htmlPropertyAttribute);
    }
    public static object GetValueByCSS(this HtmlNode node, HtmlPropertyAttribute htmlPropertyAttribute)
    {
        var nodeCss = node.QuerySelector(htmlPropertyAttribute.Expression);
        if (nodeCss == null)
            return null;

        return SortValueBySource(nodeCss, htmlPropertyAttribute);
    }

    public static object SortValueBySource(this HtmlNode node, HtmlPropertyAttribute htmlPropertyAttribute)
    {
        return htmlPropertyAttribute.ValueSource switch
        {
            NodeValueSource.InnerText_Clean => GetValueByType(CleanTextFromHtml(node.InnerText), htmlPropertyAttribute),
            NodeValueSource.InnerText => GetValueByType(node.InnerText, htmlPropertyAttribute),
            NodeValueSource.InnerHtml => GetValueByType(node.InnerHtml, htmlPropertyAttribute),
            NodeValueSource.Attribute => node.GetValueByAttribute(ToInnerHtmlPropertyAttribute(htmlPropertyAttribute)),
            _ => node.InnerText,
        };
    }

    public static object SortValueBySource(this JToken jToken, JsonValueAttribute jsonValueAttribute)
    {
        return jsonValueAttribute.ValueSource switch
        {
            JsonValueSource.Value_Clean => GetValueByType(CleanTextFromHtml(jToken.Value<string>()), jsonValueAttribute),
            JsonValueSource.Value => GetValueByType(jToken.Value<string>(), jsonValueAttribute),
            JsonValueSource.Value_FirstItem => GetValueByType(jToken.First.Value<string>(), jsonValueAttribute),
            JsonValueSource.ChildValue => jToken.GetValueByChildToken(jsonValueAttribute),
            JsonValueSource.ChildKey => jToken.GetValueByChildKey(jsonValueAttribute),
            _ => jToken.Value<string>(),
        };
    }

    private static string CleanTextFromHtml(string text)
    {
        text = text.Replace("\n", "");
        text = text.Replace("\r", "");

        text = text.Trim();

        return text;
    }
}
