using Crawler.Data.Repository;

using System.Collections.Generic;

namespace Crawler.Data.Models
{
    public partial class Baskets : IEntity
    {
        public Baskets()
        {
            BasketItem = new HashSet<BasketItem>();
        }

        public int Id { get; set; }
        public string BuyerId { get; set; }

        public virtual ICollection<BasketItem> BasketItem { get; set; }

        public bool IsValid { get => true; }
    }
}
