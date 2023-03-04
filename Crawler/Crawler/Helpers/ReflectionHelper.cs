using Crawler.Data.Attributes;

using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;

namespace Crawler.Helpers
{
    public class ReflectionHelper
    {
        internal static string GetEntityAttributes<TEntity, TAttribute>()
            where TAttribute : Attribute, IClassAttribute
        {
            var attribute = typeof(TEntity).GetCustomAttribute<TAttribute>();
            if (attribute == null || string.IsNullOrWhiteSpace(attribute.XPath))
                throw new Exception("This entity should be xpath");

            return attribute.XPath;
        }

        public static Dictionary<string, TAttribute> GetPropertyAttributes<TEntity, TAttribute>()
            where TAttribute: Attribute, IPropertyAttribute
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

        internal static object CreateNewEntity<TEntity>()
        {
            object instance = Activator.CreateInstance(typeof(TEntity));
            return instance;
        }

        internal static void TrySetProperty(object obj, string property, object value)
        {
            var prop = obj.GetType().GetProperty(property, BindingFlags.Public | BindingFlags.Instance);
            if (prop != null && prop.CanWrite)
                prop.SetValue(obj, value, null);
        }
    }
}
