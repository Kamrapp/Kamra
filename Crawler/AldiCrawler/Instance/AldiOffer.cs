using System.Globalization;
using System.Text.RegularExpressions;

namespace AldiCrawler.Instance;

[Class(XPath = "//div[@id='pdpDetails']")]
[Json(XPath = "//script[@type='application/ld+json']")]
public partial class AldiOffer : BaseOffer
{
    [Field(Expression = "//div[@class='product-reference']/div", ValueType = ObjectValueType.String)]
    public override string ProductKey { get; set; }


    [Field(Expression = "//div[@class='liveOSDavailabilityLabel']", ValueType = ObjectValueType.String)]
    public string Validity { get; set; }

    [Field(Expression = "//span[@class='pdp_price__now']", ValueType = ObjectValueType.Decimal, ValueSource = NodeValueSource.Attribute, Selector = NodeSelector.AttributeSelector, ChildExpression = "data-price")]
    [JsonValue(Expression = "price", ValueType = ObjectValueType.String)]
    //This looks better encoded in html
    //[JsonValue(Expression = "offers", ValueType = ObjectValueType.Decimal, ValueSource = JsonValueSource.ChildValue, ChildExpression = "price")]
    public override decimal Price { get; set; }

    // This is 'Ft' instead of 'HUF'
    // fix attribute data-currency
    //[Field(Expression = "//span[@class='pdp_price__now']", ValueType = ObjectValueType.Decimal)]
    [JsonValue(Expression = "priceCurrency", ValueType = ObjectValueType.String)]
    public override string Currency { get; set; }

    [Field(Expression = "//span[@class='additional-notes-price']", ValueType = ObjectValueType.String)]
    public override string Unit { get; set; }

    [JsonValue(Expression = "url", ValueType = ObjectValueType.String)]
    public override string Url { get; set; }


    public override bool IsValid => !string.IsNullOrEmpty(ProductKey);


    private const string DateFormat = "yyyy.MM.dd";
    public override void CalculateValidity()
    {
        if (string.IsNullOrEmpty(Validity))
            return;

        var validFromText = Validity[..DateFormat.Length];

        Match fromMatch = FromRegex().Match(validFromText);
        if (fromMatch.Success)
        {
            ValidFrom = ToDate(validFromText);
        }
    }

    private static DateOnly ToDate(string yearMonthDay, bool increaseYear = false)
    {
        return DateOnly.ParseExact($"{yearMonthDay}", DateFormat, CultureInfo.InvariantCulture);
    }


    [GeneratedRegex("\\d{4}.\\d{2}.\\d{2}", RegexOptions.IgnoreCase, "hu-HU")]
    private static partial Regex FromRegex();
}
