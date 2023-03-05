using Newtonsoft.Json.Linq;

namespace Crawler.Process;

public class JsonProcessor<TEntity> : BaseProcessor<TEntity, JsonAttribute, JsonValueAttribute>
    where TEntity : BaseEntity
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
