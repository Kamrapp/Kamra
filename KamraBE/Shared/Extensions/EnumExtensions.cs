namespace Shared.Extensions;

public static class EnumExtensions
{
    public static string AsText<T>(this T value) where T : Enum
    {
        return Enum.GetName(typeof(T), value);
    }
}
