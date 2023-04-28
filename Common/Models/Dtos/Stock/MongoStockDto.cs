namespace Shared.Dtos
{
    public class MongoStockDto
    {
        public int? ApiId { get; set; }
        public string? MongoId { get; set; }
        public string? MongoProductId { get; set; }
        public int? ElementId { get; set; }
        public decimal Price { get; set; }
        public string? OriginalPrice { get; set; }
        public string? Currency { get; set; }
        public string? Unit { get; set; }
        public string? Url { get; set; }
        public string? MongoShop { get; set; }
        public DateTime ValidTill { get; set; }
        public DateTime ValidFrom { get; set; }
    }
}
