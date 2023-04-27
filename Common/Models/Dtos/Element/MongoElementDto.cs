namespace Shared.Dtos
{
    public class MongoElementDto
    {
        public int? ApiId { get; set; }
        public string GlobalName { get; set; }

        public string? Manufacturer { get; set; }
        public string? DistributorKey { get; set; }
        public string? Distributor { get; set; }
        public string? Description { get; set; }
        public string? PictureUri { get; set; }
        public string? Url { get; set; }
        public string? MongoId { get; set; }
    }
}
