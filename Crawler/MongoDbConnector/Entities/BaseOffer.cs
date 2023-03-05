namespace MongoDbConnector.Entities;

public abstract class BaseOffer : BaseEntity
{
    public abstract DateOnly ValidFrom { get; set; }

    public abstract DateOnly? ValidTo { get; set; }

    public abstract string ProductKey { get; set; }

    public abstract void CalculateValidity();
}
