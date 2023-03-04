using Crawler.Data.Attributes;
using Crawler.Data.Repository;

using System.Text.Json.Nodes;

namespace Crawler.Data.Models
{
    [Entity(XPath = "//article[@class='detail']")]
    [Json(XPath = "//script[@data-hid='json_data_product']")]
    //[Entity(XPath = "//*[@data-category='Termékeink']")]
    //[CrawlerEntity(XPath = "//*[@id='productbox']")]
    public partial class LidlProduct : IEntity
    {
        // Mapped
        [Field(Expression = "//h1[@class='keyfacts__title']", ValueType = AttributeValueType.String)]
        [JsonValue(Key = "name")]
        public string Name { get; set; }
        [Field(Expression = "//div[@class='keyfacts__supplemental-description']", ValueType = AttributeValueType.String)]
        [JsonValue(Key = "brand")]
        public string BrandName { get; set; }
        [Field(Expression = "//div[@class='keyfacts__description']", ValueType = AttributeValueType.String, ValueSource = ValueSource.InnerHtml)]
        [JsonValue(Key = "description")]
        public string Description { get; set; }
        [Field(Expression = "//div[@class='m-price__price']", ValueType = AttributeValueType.Decimal)]
        public decimal Price { get; set; }
        [Field(Expression = "//div[@class='m-price__currency']", ValueType = AttributeValueType.String)]
        public string Currency { get; set; }
        [Field(Expression = "//div[@class='price-footer']", ValueType = AttributeValueType.String)]
        public string Unit { get; set; }

        [Field(Expression = "//img[@class='gallery-image__img']", ValueType = AttributeValueType.String, ValueSource = ValueSource.Attribute, ValueExpression = "src")]
        [JsonValue(Key = "image")]
        public string PictureUri { get; set; }

        [Field(Expression = "//script[@data-hid='unified_datalayer_product']", ValueType = AttributeValueType.String)]
        public string ScriptContent { get; set; }
        
        [Field(Expression = "//script[@data-hid='json_data_product']", ValueType = AttributeValueType.String)]
        public JsonValue JsonContent { get; set; }


        [JsonValue(Key = "offers")]
        public string Offers { get; set; }

        [JsonValue(Key = "url")]
        public string Url { get; set; }


        //cannot map ID but comes from the link value at the end e.g.: "p3434343"
        //[Field(Expression = "data-id", SelectorType = SelectorType.AttributeSelector, ValueType = AttributeValueType.Int32)]
        [JsonValue(Key = "sku")]
        public int Id { get; set; }

        public bool IsValid { get => !string.IsNullOrEmpty(Name); }


    }
}
