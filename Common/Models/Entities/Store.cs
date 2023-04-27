using System.ComponentModel.DataAnnotations;

namespace Models.Entities
{
    public class Store
    {
        public Store()
        {
            Stocks = new List<Stock>();
        }

        [Key]
        public int Id { get; set; }
        [Required]
        public string Name { get; set; }

        public ICollection<Stock> Stocks { get; set; }

        //TODO Stores should have Address
        //public Address Addresss { get; set; }
    }

}
