using MongoDB.Bson.Serialization.Attributes;

namespace Models.Records.Base;

[BsonIgnoreExtraElements]
public class BaseOffer : BaseRecord
{
    public BaseOffer()
        : base()
    {
        ValidFrom = DateOnly.MinValue;
        ValidTo = DateOnly.MaxValue;
    }

    public int? ApiId { get; set; }

    public virtual DateOnly ValidFrom { get; set; }

    public virtual DateOnly ValidTo { get; set; }

    public virtual string? ProductKey { get; set; }

    [Update]
    public virtual decimal Price { get; set; }

    public virtual string? OriginalPrice { get; set; }
    [Update]
    public virtual string? Currency { get; set; }
    [Update]
    public virtual string? Unit { get; set; }
    [Update]
    public virtual string? Url { get; set; }
    public virtual string? MongoShop { get; set; }

    public virtual int? ElementId { get; set; }

    public virtual void CalculateValidity()
    {
    }
    public virtual void CalculateDiscountValidity()
    {
    }

    public override bool IsValid => string.IsNullOrEmpty(ProductKey);

}
