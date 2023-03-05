using System.Reflection;

namespace Crawler.Helpers;

public static class ReflectionHelper
{
    internal static string GetClassAttributes<TEntity, TAttribute>()
        where TAttribute : BaseClassAttribute
    {
        var attribute = typeof(TEntity).GetCustomAttribute<TAttribute>();
        if (attribute == null || string.IsNullOrWhiteSpace(attribute.XPath))
            throw new Exception("This entity should be xpath");

        return attribute.XPath;
    }

    public static Dictionary<string, TAttribute> GetPropertyAttributes<TEntity, TAttribute>()
        where TAttribute: BasePropertyAttribute
    {
        var attributeDictionary = new Dictionary<string, TAttribute>();

        PropertyInfo[] props = typeof(TEntity).GetProperties();
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

    public static List<PropertyInfo> GetPropertiesToUpdate<TEntity>()
    {
        var propertyList = new List<PropertyInfo>();

        PropertyInfo[] props = typeof(TEntity).GetProperties();
        var propList = props.Where(p => p.CustomAttributes.Any());

        foreach (PropertyInfo prop in propList)
        {
            var attr = prop.GetCustomAttribute<UpdateAttribute>();
            if (attr != null)
            {
                propertyList.Add(prop);
            }
        }
        return propertyList;
    }

    internal static object CreateNewEntity<TEntity>()
    {
        object instance = Activator.CreateInstance(typeof(TEntity));
        return instance;
    }

    internal static void TrySetProperty(object obj, string property, object value, bool overWrite = false)
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
            if(!overWrite)
            {
                //Console.WriteLine();
                //Console.WriteLine($"Value already set for property <{prop.Name}> of type <{prop.PropertyType.Name}> in object type <{obj.GetType().Name}>.");
                //Console.WriteLine("Keeping current value...");
                //Console.WriteLine("Current value:");
                //Console.WriteLine(currentValue);
                //Console.WriteLine("New value:");
                //Console.WriteLine(value);
                //Console.WriteLine();
                //Console.WriteLine();
                //Console.WriteLine();
                return;
            }
        }

        try
        {
            prop.SetValue(obj, value, null);
        }
        catch(Exception ex)
        { 
            Console.WriteLine(ex.ToString() );
        }
    }

    public static (bool, TEntity) UpdateValues<TEntity>(this TEntity currentEntity, TEntity entityToUpdate)
        where TEntity : BaseEntity
    {
        bool anythingUpdated = false;

        var properties = GetPropertiesToUpdate<TEntity>();
        foreach (var property in properties)
        {
            var valueToUpdate = property.GetValue(entityToUpdate);

            // Let's not delete data just because the shop removed it
            if (valueToUpdate == null)
                continue;

            var currentValue = property.GetValue(currentEntity);

            if (valueToUpdate.Equals(currentValue))
                continue;

            property.SetValue(currentEntity, valueToUpdate);

            if (!anythingUpdated)
                anythingUpdated = true;
        }

        return (anythingUpdated, currentEntity);
    }
}
