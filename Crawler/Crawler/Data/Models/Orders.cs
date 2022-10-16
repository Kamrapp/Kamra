using Crawler.Data.Repository;

using System;
using System.Collections.Generic;

namespace Crawler.Data.Models
{
    public partial class Orders : IEntity
    {
        public Orders()
        {
            OrderItems = new HashSet<OrderItems>();
        }

        public int Id { get; set; }
        public string BuyerId { get; set; }
        public DateTimeOffset OrderDate { get; set; }
        public string ShipToAddressCity { get; set; }
        public string ShipToAddressCountry { get; set; }
        public string ShipToAddressState { get; set; }
        public string ShipToAddressStreet { get; set; }
        public string ShipToAddressZipCode { get; set; }

        public virtual ICollection<OrderItems> OrderItems { get; set; }

        public bool IsValid { get => true; }
    }
}
