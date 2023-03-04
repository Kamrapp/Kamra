using System;

namespace Crawler.Data.Attributes
{
    public class JsonAttribute : Attribute, IClassAttribute
    {
        public string XPath { get; set; }
    }
}
