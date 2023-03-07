namespace Crawler.Process;

public abstract class BaseProcessor<TProduct, TOffer, TClassAttribute, TPropertyAttribute> : IProcessor<TProduct, TOffer>
    where TProduct : BaseProduct
    where TOffer : BaseOffer
    where TClassAttribute : BaseClassAttribute
    where TPropertyAttribute : BasePropertyAttribute
{
    private void SetValues<TObject>(TObject record, HtmlDocument document)
        where TObject : class
    {
        var productNameValueDictionary = GetColumnNameValuePairsFromHtml<TObject>(document);
        foreach (var pair in productNameValueDictionary)
        {
            ReflectionHelper.TrySetProperty(record, pair.Key, pair.Value);
        }
    }

    public (TProduct, TOffer) Process(HtmlDocument document, TProduct product, TOffer offer)
    {
        product ??= ReflectionHelper.CreateObject<TProduct>();
        SetValues(product, document);

        if (!product.IsValid)
            product = null;

        offer ??= ReflectionHelper.CreateObject<TOffer>();
        SetValues(offer, document);

        // Very important!
        offer.CalculateValidity();

        if (!offer.IsValid)
            offer = null;

        return (product, offer);
    }

    protected abstract void SetValueObject(HtmlNode node);
    protected abstract object GetValueObject(TPropertyAttribute propertyAttribute);

    protected Dictionary<string, object> GetColumnNameValuePairsFromHtml<TRecord>(HtmlDocument document)
    {
        var columnNameValueDictionary = new Dictionary<string, object>();

        var classExpression = ReflectionHelper.GetClassAttributes<TRecord, TClassAttribute>();
        var classNode = document.DocumentNode.SelectSingleNode(classExpression);

        SetValueObject(classNode);

        var propertyExpressions = ReflectionHelper.GetPropertyAttributes<TRecord, TPropertyAttribute>();
        foreach (var expression in propertyExpressions)
        {
            var columnName = expression.Key;
            var columnValue = GetValueObject(expression.Value);

            columnNameValueDictionary.Add(columnName, columnValue);
        }

        return columnNameValueDictionary;
    }
}
