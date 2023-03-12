namespace Crawler.Process;

public class DiscountHtmlProcessor<TProduct, TOffer> : BaseProcessor<TProduct, TOffer, DiscountClassAttribute, DiscountFieldAttribute>
    where TProduct : BaseProduct
    where TOffer : BaseOffer
{
    private HtmlNode ClassNode;
    protected override void SetValueObject(HtmlNode classNode)
    {
        ClassNode = classNode;
    }

    protected override object GetValueObject(DiscountFieldAttribute propertyAttribute)
    {
        return ClassNode?.GetValue(propertyAttribute);
    }
}
