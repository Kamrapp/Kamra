namespace BaseCrawler.Process;

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

    public (TProduct, TOffer) Process(HtmlDocument document, TProduct product, TOffer offer, bool isDiscount = false)
    {
        product ??= ReflectionHelper.CreateObject<TProduct>();
        SetValues(product, document);

        offer ??= ReflectionHelper.CreateObject<TOffer>();
        SetValues(offer, document);

        // Very important!
        if (!isDiscount)
            offer.CalculateValidity();
        else
            offer.CalculateDiscountValidity();

        return (product, offer);
    }

    protected abstract void SetValueObject(HtmlNode node);
    protected abstract object GetValueObject(TPropertyAttribute propertyAttribute);

    protected Dictionary<string, object> GetColumnNameValuePairsFromHtml<TRecord>(HtmlDocument document)
    {
        var columnNameValueDictionary = new Dictionary<string, object>();

        var classExpression = ReflectionHelper.GetClassAttributes<TRecord, TClassAttribute>();

        HtmlNode classNode;

        // might already have the filtered node
        if (classExpression != null)
            classNode = document.DocumentNode.SelectSingleNode(classExpression);
        else
            classNode = document.DocumentNode;

        SetValueObject(classNode);

        var propertyExpressions = ReflectionHelper.GetPropertyAttributes<TRecord, TPropertyAttribute>();
        foreach (var expression in propertyExpressions)
        {
            var columnName = expression.Key;
            object columnValue;
            try
            {
                columnValue = GetValueObject(expression.Value);
            }
            catch
            {
                continue;
            }

            columnNameValueDictionary.Add(columnName, columnValue);
        }

        return columnNameValueDictionary;
    }
}
