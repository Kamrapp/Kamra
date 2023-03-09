namespace AldiCrawler.Instance;

[Class(XPath = "//main")]
[Json(XPath = "//script[@type='application/ld+json']")]
public class AldiProduct : BaseProduct
{
    //[Field(Expression = "//div[@class='product-reference']/div", ValueType = ObjectValueType.String)]
    [Field(Expression = "//div[@id='pdpDetails']", ValueType = ObjectValueType.String, ValueSource = NodeValueSource.Attribute, Selector = NodeSelector.XPath, ChildExpression = "data-product-code")]
    public override string Key { get; set; }

    //[Field(Expression = "//h1[@class='target_product_name']", ValueType = ObjectValueType.String, ValueSource = NodeValueSource.Attribute, Selector = NodeSelector.XPath, ChildExpression = "data-product-name")]
    [JsonValue(Expression = "name", ValueType = ObjectValueType.String)]
    public string Name { get; set; }

    [Update]
    //[Field(Expression = "//div[@class='keyfacts__supplemental-description']", ValueType = ObjectValueType.String)]
    // this has NO BRAND when empty
    [JsonValue(Expression = "brand", ValueType = ObjectValueType.String)]
    public string BrandName { get; set; }

    [Update]
    [JsonValue(Expression = "category", ValueType = ObjectValueType.String)]
    public string Category { get; set; }

    [Update]
    // fix data-description value attribute
    [Field(Expression = "//section[@class='tab-content']/*/div[contains(@class, infobox)]", ValueType = ObjectValueType.String, ValueSource = NodeValueSource.Attribute, Selector = NodeSelector.XPath, ChildExpression = "data-description")]
    // This is just "ingyenes szállítás"
    //[JsonValue(Expression = "description", ValueType = ObjectValueType.String)]
    public string Description { get; set; }

    [Update]
    // both are fine
    //[Field(Expression = "//a[@class='zoom-ico-image']", ValueType = ObjectValueType.String, ValueSource = NodeValueSource.Attribute, ChildExpression = "src")]
    [JsonValue(Expression = "image", ValueType = ObjectValueType.String, ValueSource = JsonValueSource.Value)]
    public string PictureUri { get; set; }

    [Update]
    [Field(Expression = "//script[@type='application/ld+json']", ValueType = ObjectValueType.String)]
    public string JsonContent { get; set; }

    [Update]
    [Field(Expression = "//link[@rel='canonical']", ValueType = ObjectValueType.String, ValueSource = NodeValueSource.Attribute, Selector = NodeSelector.XPath, ChildExpression = "href")]
    public string Url { get; set; }

    public override bool IsValid => !string.IsNullOrEmpty(Name) && !string.IsNullOrEmpty(Key);
}
