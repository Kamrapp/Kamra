namespace Crawler.Process;

public class HtmlProcessor<TEntity> : BaseProcessor<TEntity, EntityAttribute, FieldAttribute>
    where TEntity : class, IDbRecord
{
    private HtmlNode EntityNode;
    protected override void SetValueObject(HtmlNode entityNode)
    {
        EntityNode = entityNode;
    }

    protected override object GetValueObject(FieldAttribute propertyAttribute)
    {
        return EntityNode?.GetValue(propertyAttribute);
    }
}
