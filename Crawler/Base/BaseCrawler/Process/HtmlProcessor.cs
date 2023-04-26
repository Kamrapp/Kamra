namespace BaseCrawler.Process;

public class HtmlProcessor<TProduct, TOffer> : BaseProcessor<TProduct, TOffer, ClassAttribute, FieldAttribute>
    where TProduct : BaseProduct
    where TOffer : BaseOffer
{
    private HtmlNode ClassNode;
    protected override void SetValueObject(HtmlNode classNode)
    {
        ClassNode = classNode;
    }

    protected override object GetValueObject(FieldAttribute propertyAttribute)
    {
        return ClassNode?.GetValue(propertyAttribute);
    }
}
