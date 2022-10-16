using System;

namespace Crawler.Data.Attributes
{
    public class FieldAttribute : Attribute
    {
        public string Expression { get; set; }
        public SelectorType SelectorType { get; set; }
        public AttributeValueType ValueType { get; set; }
    }
}
