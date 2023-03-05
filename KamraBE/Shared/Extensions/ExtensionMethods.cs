namespace Shared.Extensions;

public static class EnumerationExtensions
{
    public static void AddIfNotExists<T>(this List<T> list, T value)
    {
        if (list.Contains(value))
            return;

        list.Add(value);
    }

    public static void ForEach<T>(this IEnumerable<T> source, Action<T> action)
    {
        foreach (T element in source)
            action(element);
    }
}
