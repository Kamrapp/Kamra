using Shared.Attributes.PropertyAttributes;

namespace MongoDbConnector.Entities;

public abstract class BaseOffer : BaseEntity
{
    public abstract DateOnly ValidFrom { get; set; }

    public abstract DateOnly? ValidTo { get; set; }

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

    public override bool IsValid => string.IsNullOrEmpty(ProductKey);
}
