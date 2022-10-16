using Crawler.Data.Attributes;
using Crawler.Data.Repository;

namespace Crawler.Data.Models
{
    [Entity(XPath = "//*[@data-category='Termékeink']")]
    //[CrawlerEntity(XPath = "//*[@id='productbox']")]
    public partial class Catalog : IEntity
    {
        [Field(Expression = "data-id", SelectorType = SelectorType.AttributeSelector, ValueType = AttributeValueType.Int32)]
        public int Id { get; set; }
        [Field(Expression = "1", SelectorType = SelectorType.FixedValue)]
        public int CatalogBrandId { get; set; }
        [Field(Expression = "1", SelectorType = SelectorType.FixedValue)]
        public int CatalogTypeId { get; set; }
        public string Description { get; set; }
        //[CrawlerField(Expression = "//*[@id='itemTitle']/text()", SelectorType = SelectorType.XPath)]
        [Field(Expression = "data-name", SelectorType = SelectorType.AttributeSelector, ValueType = AttributeValueType.String)]
        public string Name { get; set; }
        public string PictureUri { get; set; }

        [Field(Expression = "data-price", SelectorType = SelectorType.AttributeSelector, ValueType = AttributeValueType.Decimal)]
        public decimal Price { get; set; }

        public virtual CatalogBrand CatalogBrand { get; set; }
        public virtual CatalogType CatalogType { get; set; }

        public bool IsValid { get => !string.IsNullOrEmpty(Name); }
    }
}
