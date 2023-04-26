using System.ComponentModel.DataAnnotations;

namespace Models.Entities
{
    public class Brand
    {
        public Brand()
        {
            Stocks = new List<Stock>();
        }

        [Key]
        public int Id { get; set; }
        [Required]
        public string Name { get; set; }

        public ICollection<Stock> Stocks { get; set; }

        //TODO Brands should have Stores that have Addresses
        //public Address Address { get; set; }

    }

}
