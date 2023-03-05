using Crawler.Data.Attributes.ClassAttributes;
using Crawler.Data.Attributes.PropertyAttributes;
using Crawler.Data.Repository;
using Crawler.Helpers;

using HtmlAgilityPack;

using Newtonsoft.Json.Linq;

namespace Crawler.Process
{
    public class JsonProcessor<TEntity> : BaseProcessor<TEntity, JsonAttribute, JsonValueAttribute>
        where TEntity : class, IEntity
    {
        private JObject JsonData;
        protected override void SetValueObject(HtmlNode jsonNode)
        {
            if (jsonNode == null)
                return;

            var jsonValue = jsonNode.InnerText;
            JsonData = JObject.Parse(jsonValue);
        }

        protected override object GetValueObject(JsonValueAttribute propertyAttribute)
        {
            return JsonData.GetValue(propertyAttribute);
        }
    }
}
