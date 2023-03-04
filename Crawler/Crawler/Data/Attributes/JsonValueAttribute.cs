using System;

namespace Crawler.Data.Attributes
{
    public class JsonValueAttribute : Attribute, IPropertyAttribute
    {
        public string Key { get; set; }
    }
}
