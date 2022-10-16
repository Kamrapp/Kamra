namespace Crawler.Data.Attributes
{
    /// <summary>
    /// Selector type of given attribute
    /// </summary>
    public enum SelectorType
    {
        XPath,
        CssSelector,
        AttributeSelector,
        FixedValue
    }

    public enum AttributeValueType
    {
        Int32,
        Decimal,
        String
    }
}
