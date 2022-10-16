using Crawler.Data.Repository;

using System.Collections.Generic;

namespace Crawler.Data.Models
{
    public partial class CatalogBrand : IEntity
    {
        public CatalogBrand()
        {
            Catalog = new HashSet<Catalog>();
        }

        public int Id { get; set; }
        public string Brand { get; set; }

        public virtual ICollection<Catalog> Catalog { get; set; }

        public bool IsValid { get => true; }
    }
}
