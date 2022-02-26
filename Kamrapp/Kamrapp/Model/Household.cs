using System.ComponentModel.DataAnnotations;

namespace Kamrapp.Model
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

        //TODO User should be handled here
        //public ICollection<User> Users { get; set; }

        //TODO Households should have Address
        //public Address Addresss { get; set; }

    }

}
