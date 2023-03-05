namespace Shared.Utils;

public static class StringConverter
{
    public static object ConvertStringToObject(string stringValue, ObjectValueType valueType)
    {
        object value = null;

        switch (valueType)
        {
            case ObjectValueType.Int32:
                if (int.TryParse(stringValue, out var result2))
                {
                    value = result2;
                }
                break;
            case ObjectValueType.Decimal:
                if (decimal.TryParse(stringValue, out var result3))
                {
                    value = result3;
                }
                break;
            case ObjectValueType.String:
                value = stringValue;
                break;
            default:
                break;
        }

        return value;
    }
}
