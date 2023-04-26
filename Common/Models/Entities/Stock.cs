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

        [Required]
        public int HouseholdId { get; set; }
        public virtual Household Household { get; set; }

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
    }

}
