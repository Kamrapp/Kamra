using Crawler.Data.Attributes.ClassAttributes;
using Crawler.Data.Attributes.PropertyAttributes;
using Crawler.Data.Repository;
using Crawler.Helpers;

using HtmlAgilityPack;

namespace Crawler.Process
{
    public class HtmlProcessor<TEntity> : BaseProcessor<TEntity, EntityAttribute, FieldAttribute>
        where TEntity : class, IEntity
    {
        private HtmlNode EntityNode;
        protected override void SetValueObject(HtmlNode entityNode)
        {
            EntityNode = entityNode;
        }

        protected override object GetValueObject(FieldAttribute propertyAttribute)
        {
            return EntityNode?.GetValue(propertyAttribute);
        }
    }
}
