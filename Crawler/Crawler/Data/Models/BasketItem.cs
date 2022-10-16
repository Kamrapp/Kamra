using Crawler.Data.Repository;

namespace Crawler.Data.Models
{
    public partial class BasketItem : IEntity
    {
        public int Id { get; set; }
        public int? BasketId { get; set; }
        public int CatalogItemId { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }

        public virtual Baskets Basket { get; set; }

        public bool IsValid { get => true; }
    }
}
