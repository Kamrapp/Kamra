using System.ComponentModel.DataAnnotations;

namespace Models.Entities
{
    public class Stock
    {
        public Stock()
        {
            CreatedAt = DateTime.Now;
            ValidFrom = DateTime.Now;
            ValidTill = DateTime.MaxValue;
            Quantity = 1;
        }

        [Key]
        public int Id { get; set; }

        //TODO create GenerateHash static function and hash all data for easier comparison/matching
        // Same should happen for elements to find similar items based on different partial hashes
        //public string Hash { return  }

        [Required]
        public int ElementId { get; set; }
        public virtual Element Element { get; set; }

        [EitherOr(nameof(HouseholdId), nameof(StoreId), nameof(ShopId), ErrorMessage = "Either ShopId or HouseholdId must be set, but not both.")]
        public int? HouseholdId { get; set; }
        public virtual Household Household { get; set; }

        [EitherOr(nameof(HouseholdId), nameof(StoreId), nameof(ShopId), ErrorMessage = "Either ShopId or HouseholdId must be set, but not both.")]
        public int? StoreId { get; set; }
        public virtual Store Store { get; set; }

        [EitherOr(nameof(HouseholdId), nameof(StoreId), nameof(ShopId), ErrorMessage = "Either ShopId or HouseholdId must be set, but not both.")]
        public int? ShopId { get; set; }
        public virtual Shop Shop { get; set; }

        [Required]
        [DataType(DataType.DateTime)]
        public DateTime CreatedAt { get; set; }

        [Required]
        [DataType(DataType.Date)]
        public DateTime ValidFrom { get; set; }

        [Required]
        [DataType(DataType.Date)]
        public DateTime ValidTill { get; set; }

        [Range(0, double.MaxValue,
            ErrorMessage = "How dare you create stock with negative quantity?!")]
        public double Quantity { get; set; }

        [Range(0, double.MaxValue,
            ErrorMessage = "How dare you create stock with negative price?!")]
        public double Price { get; set; }

        public string? MongoId { get; set; }
        public string? MongoPrice { get; set; }
        public string? OriginalPrice { get; set; }
        public string? Currency { get; set; }
        public string? Unit { get; set; }
        public string? Url { get; set; }
        public string? MongoShop { get; set; }
    }

}
