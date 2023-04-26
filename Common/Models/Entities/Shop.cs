using System.ComponentModel.DataAnnotations;

namespace Models.Entities
{
    public class Shop
    {
        public Shop()
        {
            Stocks = new List<Stock>();
        }

        [Key]
        public int Id { get; set; }
        [Required]
        public string Name { get; set; }

        public ICollection<Stock> Stocks { get; set; }

        public ICollection<Store> Stores { get; set; }

        //TODO Shops should have Address
        //public Address Addresss { get; set; }

    }

}
