using Newtonsoft.Json.Linq;

using Shared.Records.Base;

namespace BaseCrawler.Process;

public class JsonProcessor<TProduct, TOffer> : BaseProcessor<TProduct, TOffer, JsonAttribute, JsonValueAttribute>
    where TProduct : BaseProduct
    where TOffer : BaseOffer
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
