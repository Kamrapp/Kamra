namespace MongoDbConnector.Entities;

public abstract class BaseOffer : BaseEntity
{
    public abstract DateTime ValidFrom { get; set; }

    public abstract DateTime? ValidTo { get; set; }

    public abstract string ProductKey { get; set; }

    public abstract void CalculateValidity();
}
