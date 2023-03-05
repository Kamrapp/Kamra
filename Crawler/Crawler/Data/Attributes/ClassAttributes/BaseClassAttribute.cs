using System;

namespace Crawler.Data.Attributes.ClassAttributes
{
    public abstract class BaseClassAttribute : Attribute
    {
        public string XPath { get; set; }
    }
}
