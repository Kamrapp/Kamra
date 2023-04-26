using Shared.Attributes.PropertyAttributes;

namespace MongoDbConnector.Records;

public abstract class BaseOffer : BaseRecord
{
    public BaseOffer()
        : base()
    {
        ValidFrom = DateOnly.MinValue;
        ValidTo = DateOnly.MaxValue;
    }

    public virtual DateOnly ValidFrom { get; set; }

    public virtual DateOnly ValidTo { get; set; }

    public abstract string ProductKey { get; set; }

    [Update]
    public abstract decimal Price { get; set; }
    [Update]
    public abstract string Currency { get; set; }
    [Update]
    public abstract string Unit { get; set; }
    [Update]
    public abstract string Url { get; set; }

    public abstract void CalculateValidity();
    public virtual void CalculateDiscountValidity()
    {
    }

    public override bool IsValid => string.IsNullOrEmpty(ProductKey);

}
