using MongoDB.Bson.Serialization.Attributes;

namespace Models.Records.Base;

[BsonIgnoreExtraElements]
public class BaseProduct : BaseRecord
{
    public int? ApiId { get; set; }
    public virtual string? Name { get; set; }
    public virtual string? BrandName { get; set; }
    public virtual string? Description { get; set; }
    public virtual string? PictureUri { get; set; }
    public virtual string? Url { get; set; }
    public virtual string? Distributor { get; set; }
}
