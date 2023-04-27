namespace Shared.Extensions;

public static class EnumerationExtensions
{
    public static bool AddIfNotContains<T>(this List<T> list, T value)
    {
        if (list.Contains(value))
            return false;

        list.Add(value);
        return true;
    }

    public static void ForEach<T>(this IEnumerable<T> source, Action<T> action)
    {
        foreach (T element in source)
            action(element);
    }
}
