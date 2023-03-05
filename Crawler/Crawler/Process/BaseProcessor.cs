namespace Crawler.Process;

public abstract class BaseProcessor<TProductEntity, TOfferEntity, TClassAttribute, TPropertyAttribute> : IProcessor<TProductEntity, TOfferEntity>
    where TProductEntity : BaseProduct
    where TOfferEntity : BaseOffer
    where TClassAttribute : BaseClassAttribute
    where TPropertyAttribute : BasePropertyAttribute

{
    public (TProductEntity, TOfferEntity) Process(HtmlDocument document, TProductEntity product, TOfferEntity offer)
    {
        product ??= ReflectionHelper.CreateNewEntity<TProductEntity>() as TProductEntity;

        var productNameValueDictionary = GetColumnNameValuePairsFromHtml<TProductEntity>(document);
        foreach (var pair in productNameValueDictionary)
        {
            ReflectionHelper.TrySetProperty(product, pair.Key, pair.Value);
        }

        offer ??= ReflectionHelper.CreateNewEntity<TOfferEntity>() as TOfferEntity;

        var offerNameValueDictionary = GetColumnNameValuePairsFromHtml<TOfferEntity>(document);
        foreach (var pair in offerNameValueDictionary)
        {
            ReflectionHelper.TrySetProperty(offer, pair.Key, pair.Value);
        }

        // Very important!
        offer.CalculateValidity();

        return (product, offer);
    }

    protected abstract void SetValueObject(HtmlNode node);
    protected abstract object GetValueObject(TPropertyAttribute propertyAttribute);

    protected Dictionary<string, object> GetColumnNameValuePairsFromHtml<TEntity>(HtmlDocument document)
    {
        var columnNameValueDictionary = new Dictionary<string, object>();

        var classExpression = ReflectionHelper.GetClassAttributes<TEntity, TClassAttribute>();
        var classNode = document.DocumentNode.SelectSingleNode(classExpression);

        SetValueObject(classNode);

        var propertyExpressions = ReflectionHelper.GetPropertyAttributes<TEntity, TPropertyAttribute>();
        foreach (var expression in propertyExpressions)
        {
            var columnName = expression.Key;
            var columnValue = GetValueObject(expression.Value);

            columnNameValueDictionary.Add(columnName, columnValue);
        }

        return columnNameValueDictionary;
    }
}
