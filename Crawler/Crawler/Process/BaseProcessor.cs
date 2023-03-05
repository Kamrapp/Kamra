namespace Crawler.Process;

public abstract class BaseProcessor<TEntity, TClassAttribute, TPropertyAttribute> : IProcessor<TEntity> 
    where TEntity : class, IDbRecord
    where TClassAttribute : BaseClassAttribute
    where TPropertyAttribute : BasePropertyAttribute

{
    public TEntity Process(HtmlDocument document, TEntity entity)
    {
        entity ??= ReflectionHelper.CreateNewEntity<TEntity>() as TEntity;

        var nameValueDictionary = GetColumnNameValuePairsFromHtml(document);
        foreach (var pair in nameValueDictionary)
        {
            ReflectionHelper.TrySetProperty(entity, pair.Key, pair.Value);
        }

        return entity;
    }

    protected abstract void SetValueObject(HtmlNode node);
    protected abstract object GetValueObject(TPropertyAttribute propertyAttribute);

    protected Dictionary<string, object> GetColumnNameValuePairsFromHtml(HtmlDocument document)
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
