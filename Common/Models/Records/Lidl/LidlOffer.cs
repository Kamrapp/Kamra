using System.Globalization;
using System.Text.RegularExpressions;

namespace Shared.Records.Lidl;

[Class(XPath = "//article[@class='detail']")]
[Json(XPath = "//script[@data-hid='json_data_product']")]
public partial class LidlOffer : BaseOffer
{
    [JsonValue(Expression = "sku", ValueType = ObjectValueType.String)]
    public override string? ProductKey { get; set; }


    [Field(Expression = "//span[@class='label__text']", ValueType = ObjectValueType.String)]
    public string? Validity { get; set; }

    [Field(Expression = "//div[@class='m-price__price']", ValueType = ObjectValueType.Decimal)]
    //This looks better encoded in html
    //[JsonValue(Expression = "offers", ValueType = ObjectValueType.Decimal, ValueSource = JsonValueSource.ChildValue, ChildExpression = "price")]
    public override decimal Price { get; set; }

    // This is 'Ft' instead of 'HUF'
    //[Field(Expression = "//div[@class='m-price__currency']", ValueType = ObjectValueType.String)]
    [JsonValue(Expression = "offers", ValueType = ObjectValueType.String, ValueSource = JsonValueSource.ChildValue, ChildExpression = "priceCurrency")]
    public override string? Currency { get; set; }

    [Field(Expression = "//div[@class='price-footer']", ValueType = ObjectValueType.String)]
    public override string? Unit { get; set; }

    [JsonValue(Expression = "url", ValueType = ObjectValueType.String)]
    public override string? Url { get; set; }


    [Field(Expression = "//div[@class='m-price__rrp']", ValueType = ObjectValueType.Decimal)]
    public override string? OriginalPrice { get; set; }


    public override bool IsValid => !string.IsNullOrEmpty(ProductKey);


    private const string ValidityPrefix = "ajánlat kezdete: ";
    private const string DateFormat = "yyyy.MM.dd.";
    public override void CalculateValidity()
    {
        if (string.IsNullOrEmpty(Validity))
            return;

        if (Validity.StartsWith(ValidityPrefix))
        {
            var validFromText = Validity[ValidityPrefix.Length..];

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

            if (ValidTo < ValidFrom)
                ValidTo = ValidTo.AddYears(1);
        }
    }

    private static DateOnly ToDate(string monthAndDay, bool increaseYear = false)
    {
        var year = DateTime.Now.Year;
        if (increaseYear)
            year++;

        return DateOnly.ParseExact($"{year}.{monthAndDay}", DateFormat, CultureInfo.InvariantCulture);
    }


    [GeneratedRegex("\\d{2}.\\d{2}. - \\d{2}.\\d{2}.", RegexOptions.IgnoreCase, "hu-HU")]
    private static partial Regex FromToRegex();

    [GeneratedRegex("\\d{2}.\\d{2}.", RegexOptions.IgnoreCase, "hu-HU")]
    private static partial Regex FromRegex();
}
