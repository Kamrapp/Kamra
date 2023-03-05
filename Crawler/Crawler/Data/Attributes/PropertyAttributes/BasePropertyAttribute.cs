using Shared.Utils;

using System;

namespace Crawler.Data.Attributes.PropertyAttributes
{
    public abstract class BasePropertyAttribute<TSelector, TValueSource> : BasePropertyAttribute
        where TSelector : Enum
        where TValueSource : Enum
    {
        public TSelector Selector { get; set; }
        public TValueSource ValueSource { get; set; }
    }

    public abstract class BasePropertyAttribute : Attribute, IPropertyAttribute
    {
        public string Expression { get; set; }
        public ObjectValueType ValueType { get; set; }
        public string ChildExpression { get; set; }
    }
}
