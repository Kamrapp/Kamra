using MongoDbConnector.Repository;

namespace LidlCrawler.Instance;

[Entity(XPath = "//article[@class='detail']")]
[Json(XPath = "//script[@data-hid='json_data_product']")]
//[Entity(XPath = "//*[@data-category='Termékeink']")]
//[CrawlerEntity(XPath = "//*[@id='productbox']")]
public partial class LidlProduct : IDbRecord
{
    public ObjectId Id { get; set; }

    [JsonValue(Expression = "sku", ValueType = ObjectValueType.String)]
    public string LidlSku { get; set; }
    [Field(Expression = "//h1[@class='keyfacts__title']", ValueType = ObjectValueType.String)]
    [JsonValue(Expression = "name", ValueType = ObjectValueType.String)]
    public string Name { get; set; }
    [Field(Expression = "//div[@class='keyfacts__supplemental-description']", ValueType = ObjectValueType.String)]
    [JsonValue(Expression = "brand", ValueType = ObjectValueType.String, ValueSource = JsonValueSource.ChildValue, ChildExpression = "brand")]
    public string BrandName { get; set; }
    [Field(Expression = "//div[@class='keyfacts__description']", ValueType = ObjectValueType.String, ValueSource = NodeValueSource.InnerHtml)]
    [JsonValue(Expression = "description", ValueType = ObjectValueType.String)]
    public string Description { get; set; }
    [Field(Expression = "//div[@class='m-price__price']", ValueType = ObjectValueType.Decimal)]
    //This looks better encoded in html
    //[JsonValue(Expression = "offers", ValueType = ObjectValueType.Decimal, ValueSource = JsonValueSource.ChildValue, ChildExpression = "price")]
    public decimal Price { get; set; }
    // This is 'Ft' instead of 'HUF'
    //[Field(Expression = "//div[@class='m-price__currency']", ValueType = ObjectValueType.String)]
    [JsonValue(Expression = "offers", ValueType = ObjectValueType.String, ValueSource = JsonValueSource.ChildValue, ChildExpression = "priceCurrency")]
    public string Currency { get; set; }
    [Field(Expression = "//div[@class='price-footer']", ValueType = ObjectValueType.String)]
    public string Unit { get; set; }

    [Field(Expression = "//img[@class='gallery-image__img']", ValueType = ObjectValueType.String, ValueSource = NodeValueSource.Attribute, ChildExpression = "src")]
    [JsonValue(Expression = "image", ValueType = ObjectValueType.String, ValueSource = JsonValueSource.Value_FirstItem)]
    public string PictureUri { get; set; }

    [Field(Expression = "//script[@data-hid='unified_datalayer_product']", ValueType = ObjectValueType.String)]
    public string ScriptContent { get; set; }

    [Field(Expression = "//script[@data-hid='json_data_product']", ValueType = ObjectValueType.String)]
    public string JsonContent { get; set; }

    [JsonValue(Expression = "url", ValueType = ObjectValueType.String)]
    public string Url { get; set; }

    //cannot map ID but comes from the link value at the end e.g.: "p3434343"
    //[Field(Expression = "data-id", NodeSelector = NodeSelector.AttributeSelector, ValueType = AttributeValueType.Int32)]

    public bool IsValid { get => !string.IsNullOrEmpty(Name) && !string.IsNullOrEmpty(LidlSku); }
    public string Key => LidlSku;
}
