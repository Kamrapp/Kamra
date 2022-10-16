using Crawler.Data.Repository;

namespace Crawler.Data.Models
{
    public partial class OrderItems : IEntity
    {
        public int Id { get; set; }
        public int? OrderId { get; set; }
        public decimal UnitPrice { get; set; }
        public int Units { get; set; }
        public int ItemOrderedCatalogItemId { get; set; }
        public string ItemOrderedPictureUri { get; set; }
        public string ItemOrderedProductName { get; set; }

        public virtual Orders Order { get; set; }

        public bool IsValid { get => true; }
    }
}
