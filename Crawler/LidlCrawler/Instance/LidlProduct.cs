namespace LidlCrawler.Instance;

[Entity(XPath = "//article[@class='detail']")]
[Json(XPath = "//script[@data-hid='json_data_product']")]
public class LidlProduct : BaseEntity
{
    public static new string Collection => "LidlCollection";

    [JsonValue(Expression = "sku", ValueType = ObjectValueType.String)]
    public override string Key { get; set; }

    [Field(Expression = "//h1[@class='keyfacts__title']", ValueType = ObjectValueType.String)]
    [JsonValue(Expression = "name", ValueType = ObjectValueType.String)]
    public string Name { get; set; }

    [Update]
    [Field(Expression = "//div[@class='keyfacts__supplemental-description']", ValueType = ObjectValueType.String)]
    [JsonValue(Expression = "brand", ValueType = ObjectValueType.String, ValueSource = JsonValueSource.ChildValue, ChildExpression = "brand")]
    public string BrandName { get; set; }

    [Update]
    [Field(Expression = "//div[@class='keyfacts__description']", ValueType = ObjectValueType.String, ValueSource = NodeValueSource.InnerHtml)]
    [JsonValue(Expression = "description", ValueType = ObjectValueType.String)]
    public string Description { get; set; }

    [Update]
    [Field(Expression = "//div[@class='m-price__price']", ValueType = ObjectValueType.Decimal)]
    //This looks better encoded in html
    //[JsonValue(Expression = "offers", ValueType = ObjectValueType.Decimal, ValueSource = JsonValueSource.ChildValue, ChildExpression = "price")]
    public decimal Price { get; set; }

    [Update]
    // This is 'Ft' instead of 'HUF'
    //[Field(Expression = "//div[@class='m-price__currency']", ValueType = ObjectValueType.String)]
    [JsonValue(Expression = "offers", ValueType = ObjectValueType.String, ValueSource = JsonValueSource.ChildValue, ChildExpression = "priceCurrency")]
    public string Currency { get; set; }

    [Update]
    [Field(Expression = "//div[@class='price-footer']", ValueType = ObjectValueType.String)]
    public string Unit { get; set; }

    [Update]
    [Field(Expression = "//img[@class='gallery-image__img']", ValueType = ObjectValueType.String, ValueSource = NodeValueSource.Attribute, ChildExpression = "src")]
    [JsonValue(Expression = "image", ValueType = ObjectValueType.String, ValueSource = JsonValueSource.Value_FirstItem)]
    public string PictureUri { get; set; }

    [Update]
    [Field(Expression = "//script[@data-hid='unified_datalayer_product']", ValueType = ObjectValueType.String)]
    public string ScriptContent { get; set; }

    [Update]
    [Field(Expression = "//script[@data-hid='json_data_product']", ValueType = ObjectValueType.String)]
    public string JsonContent { get; set; }

    [Update]
    [JsonValue(Expression = "url", ValueType = ObjectValueType.String)]
    public string Url { get; set; }

    public override bool IsValid { get => !string.IsNullOrEmpty(Name) && !string.IsNullOrEmpty(Key); }
}
