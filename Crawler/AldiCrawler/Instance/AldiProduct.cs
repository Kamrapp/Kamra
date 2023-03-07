namespace AldiCrawler.Instance;

[Class(XPath = "//div[@id='pdpDetails']")]
[Json(XPath = "//script[@type='application/ld+json']")]
public class AldiProduct : BaseProduct
{
    [Field(Expression = "//div[@class='product-reference']/div", ValueType = ObjectValueType.String)]
    public override string Key { get; set; }

    //[Field(Expression = "//h1[@class='target_product_name']", ValueType = ObjectValueType.String, ValueSource = NodeValueSource.Attribute, Selector = NodeSelector.AttributeSelector, ChildExpression = "data-product-name")]
    [JsonValue(Expression = "name", ValueType = ObjectValueType.String)]
    public string Name { get; set; }

    [Update]
    //[Field(Expression = "//div[@class='keyfacts__supplemental-description']", ValueType = ObjectValueType.String)]
    // this has NO BRAND when empty
    [JsonValue(Expression = "brand", ValueType = ObjectValueType.String, ValueSource = JsonValueSource.ChildValue, ChildExpression = "brand")]
    public string BrandName { get; set; }

    [Update]
    [JsonValue(Expression = "category", ValueType = ObjectValueType.String, ValueSource = JsonValueSource.ChildValue, ChildExpression = "brand")]
    public string Category { get; set; }

    [Update]
    // fix data-description value attribute
    [Field(Expression = "//div[@class='infobox']", ValueType = ObjectValueType.String, ValueSource = NodeValueSource.Attribute, Selector = NodeSelector.AttributeSelector, ChildExpression = "data-secription")]
    // This is just "ingyenes szállítás"
    //[JsonValue(Expression = "description", ValueType = ObjectValueType.String)]
    public string Description { get; set; }

    [Update]
    // both are fine
    //[Field(Expression = "//a[@class='zoom-ico-image']", ValueType = ObjectValueType.String, ValueSource = NodeValueSource.Attribute, ChildExpression = "src")]
    [JsonValue(Expression = "image", ValueType = ObjectValueType.String, ValueSource = JsonValueSource.Value_FirstItem)]
    public string PictureUri { get; set; }

    [Update]
    [Field(Expression = "//script[@data-hid='json_data_product']", ValueType = ObjectValueType.String)]
    public string JsonContent { get; set; }

    [Update]
    [JsonValue(Expression = "url", ValueType = ObjectValueType.String)]
    public string Url { get; set; }

    public override bool IsValid => !string.IsNullOrEmpty(Name) && !string.IsNullOrEmpty(Key);
}
