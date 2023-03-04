using System;

namespace Crawler.Data.Attributes
{
    public class FieldAttribute : Attribute, IPropertyAttribute
    {
        public string Expression { get; set; }
        public SelectorType SelectorType { get; set; }
        public AttributeValueType ValueType { get; set; }
        public ValueSource ValueSource { get; set; }
        public string ValueExpression { get; set; }
    }
}
