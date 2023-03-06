using System.Reflection;

namespace Shared.Attributes;

public static class ReflectionHelper
{
    public static string GetClassAttributes<TType, TAttribute>()
        where TAttribute : BaseClassAttribute
    {
        var attribute = typeof(TType).GetCustomAttribute<TAttribute>();
        if (attribute == null || string.IsNullOrWhiteSpace(attribute.XPath))
            throw new Exception("This attribute should have xpath");

        return attribute.XPath;
    }

    public static Dictionary<string, TAttribute> GetPropertyAttributes<TType, TAttribute>()
        where TAttribute : BasePropertyAttribute
    {
        var attributeDictionary = new Dictionary<string, TAttribute>();

        PropertyInfo[] props = typeof(TType).GetProperties();
        var propList = props.Where(p => p.CustomAttributes.Count() > 0);

        foreach (PropertyInfo prop in propList)
        {
            var attr = prop.GetCustomAttribute<TAttribute>();
            if (attr != null)
            {
                attributeDictionary.Add(prop.Name, attr);
            }
        }
        return attributeDictionary;
    }

    public static List<PropertyInfo> GetPropertiesToUpdate<TType>()
    {
        var propertyList = new List<PropertyInfo>();

        PropertyInfo[] props = typeof(TType).GetProperties();
        var propList = props.Where(p => p.CustomAttributes.Any());

        foreach (PropertyInfo prop in propList)
        {
            var attr = prop.GetCustomAttribute<UpdateAttribute>(true);
            if (attr != null)
            {
                propertyList.Add(prop);
            }
        }
        return propertyList;
    }

    public static object CreateObject<TType>()
    {
        object instance = Activator.CreateInstance(typeof(TType));
        return instance;
    }

    public static void TrySetProperty(object obj, string property, object value, bool overWrite = false)
    {
        if (value == null)
            return;

        var prop = obj.GetType().GetProperty(property, BindingFlags.Public | BindingFlags.Instance);
        if (prop == null)
            return;

        if (!prop.CanWrite)
            return;

        var currentValue = prop.GetValue(obj);

        if (value.Equals(currentValue))
            return;

        if (prop.PropertyType == typeof(string) && currentValue != null)
        {
            if (!overWrite)
            {
                return;
            }
        }

        try
        {
            prop.SetValue(obj, value, null);
        }
        catch (Exception ex)
        {
            Console.WriteLine(ex.ToString());
        }
    }

    public static (bool, TType) UpdateValues<TType>(this TType currentObject, TType objectToUpdate)
        where TType : IBaseEntity
    {
        bool anythingUpdated = false;

        var properties = GetPropertiesToUpdate<TType>();
        foreach (var property in properties)
        {
            var valueToUpdate = property.GetValue(objectToUpdate);

            // Let's not delete data just because the shop removed it
            if (valueToUpdate == null)
                continue;

            var currentValue = property.GetValue(currentObject);

            if (valueToUpdate.Equals(currentValue))
                continue;

            property.SetValue(currentObject, valueToUpdate);

            if (!anythingUpdated)
                anythingUpdated = true;
        }

        return (anythingUpdated, currentObject);
    }
}
