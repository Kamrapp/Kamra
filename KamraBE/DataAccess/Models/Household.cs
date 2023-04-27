using System.ComponentModel.DataAnnotations;

namespace DataAccess.Models
{
    public class Household
    {
        public Household()
        {
            Stocks = new List<Stock>();
        }

        [Key]
        public int Id { get; set; }
        [Required]
        public string Name { get; set; }

        public ICollection<Stock> Stocks { get; set; }

        public ICollection<User> Users { get; set; }

        //TODO Households should have Address
        //public Address Addresss { get; set; }

    }

}
