namespace Models.Records.Base;

public abstract class BaseProduct : BaseRecord
{
    public abstract string? Name { get; set; }
    public abstract string? BrandName { get; set; }
    public abstract string? Description { get; set; }
    public abstract string? PictureUri { get; set; }
    public abstract string? Url { get; set; }
}
