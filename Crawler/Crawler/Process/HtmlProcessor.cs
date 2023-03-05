namespace Crawler.Process;

public class HtmlProcessor<TProductEntity, TOfferEntity> : BaseProcessor<TProductEntity, TOfferEntity, EntityAttribute, FieldAttribute>
    where TProductEntity : BaseProduct
    where TOfferEntity : BaseOffer
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
