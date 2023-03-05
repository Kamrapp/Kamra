using System;
using System.Globalization;
using System.Text.RegularExpressions;

namespace LidlCrawler.Instance;

[Entity(XPath = "//article[@class='detail']")]
[Json(XPath = "//script[@data-hid='json_data_product']")]
public partial class LidlOffer : BaseOffer
{
    public static new string Collection => "LidlOffers";

    [Field(Expression = "//span[@class='label__text']", ValueType = ObjectValueType.String)]
    public string Validity { get; set; }

    public override DateTime ValidFrom { get; set; }

    public override DateTime? ValidTo { get; set; }

    [JsonValue(Expression = "sku", ValueType = ObjectValueType.String)]
    public override string ProductKey { get; set; }

    [Update]
    [Field(Expression = "//div[@class='m-price__price']", ValueType = ObjectValueType.Decimal)]
    //This looks better encoded in html
    //[JsonValue(Expression = "offers", ValueType = ObjectValueType.Decimal, ValueSource = JsonValueSource.ChildValue, ChildExpression = "price")]
    public decimal Price { get; set; }

    [Update]
    // This is 'Ft' instead of 'HUF'
    //[Field(Expression = "//div[@class='m-price__currency']", ValueType = ObjectValueType.String)]
    [JsonValue(Expression = "offers", ValueType = ObjectValueType.String, ValueSource = JsonValueSource.ChildValue, ChildExpression = "priceCurrency")]
    public string Currency { get; set; }

    [Update]
    [Field(Expression = "//div[@class='price-footer']", ValueType = ObjectValueType.String)]
    public string Unit { get; set; }

    [Update]
    [JsonValue(Expression = "url", ValueType = ObjectValueType.String)]
    public string Url { get; set; }

    public override bool IsValid => !string.IsNullOrEmpty(ProductKey);

    private const string ValidityPrefix = "ajánlat kezdete: ";
    private const string DateFormat = "yyyy.mm.dd.";

    public override void CalculateValidity()
    {
        ValidFrom = DateTime.MinValue;
        ValidTo = DateTime.MaxValue;

        if( string.IsNullOrEmpty(Validity))
            return;

        if(Validity.StartsWith(ValidityPrefix))
        {
            var validFromText = Validity.Substring(ValidityPrefix.Length);

            Match fromMatch = FromRegex().Match(validFromText);
            if (fromMatch.Success)
            {
                ValidFrom = ToDate(validFromText);
            }

            return;
        }

        Match m = FromToRegex().Match(Validity);
        if (m.Success)
        {
            ValidFrom = ToDate(Validity[..6]);
            ValidTo = ToDate(Validity[^6..]);

            // Thank you nullable
            if (ValidTo < ValidFrom)
                ValidTo = ((DateTime)ValidTo).AddYears(1);
        }
    }

    private DateTime ToDate(string monthAndDay, bool increaseYear = false)
    {
        var year = DateTime.UtcNow.Year;
        if (increaseYear)
            year++;

        return DateTime.ParseExact($"{year}.{monthAndDay}", DateFormat, CultureInfo.InvariantCulture);
    }

    [GeneratedRegex("\\d{2}.\\d{2}. - \\d{2}.\\d{2}.", RegexOptions.IgnoreCase, "hu-HU")]
    private static partial Regex FromToRegex();

    [GeneratedRegex("\\d{2}.\\d{2}.", RegexOptions.IgnoreCase, "hu-HU")]
    private static partial Regex FromRegex();
}
