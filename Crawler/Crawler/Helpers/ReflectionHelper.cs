using Crawler.Data.Attributes;

using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;

namespace Crawler.Helpers
{
    public class ReflectionHelper
    {
        internal static string GetEntityExpression<TEntity>()
        {
            var entityAttribute = typeof(TEntity).GetCustomAttribute<EntityAttribute>();
            if (entityAttribute == null || string.IsNullOrWhiteSpace(entityAttribute.XPath))
                throw new Exception("This entity should be xpath");

            return entityAttribute.XPath;
        }

        public static Dictionary<string, Tuple<SelectorType, AttributeValueType, string>> GetPropertyAttributes<TEntity>()
        {
            var attributeDictionary = new Dictionary<string, Tuple<SelectorType, AttributeValueType, string>>();

            PropertyInfo[] props = typeof(TEntity).GetProperties();
            var propList = props.Where(p => p.CustomAttributes.Count() > 0);

            foreach (PropertyInfo prop in propList)
            {
                var attr = prop.GetCustomAttribute<FieldAttribute>();
                if (attr != null)
                {
                    attributeDictionary.Add(prop.Name, Tuple.Create(attr.SelectorType, attr.ValueType, attr.Expression));
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
