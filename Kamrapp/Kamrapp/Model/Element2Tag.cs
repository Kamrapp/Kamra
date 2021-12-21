using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Kamrapp.Model
{
    public class Element2Tag
    {
        public Element2Tag()
        {
            PropertyValues = new List<PropertyValue>();
        }

        [Required]
        [ForeignKey(nameof(Tag))]
        public int TagId { get; set; }
        public virtual Tag Tag { get; set; }

        [Required]
        [ForeignKey(nameof(Element))]
        public int ElementId { get; set; }
        public virtual Element Element { get; set; }

        [Range(-10000, 10000,
        ErrorMessage = "Value for {0} must be between {1} and {2}.")]
        public double Weight { get; set; }

        // PropertyValues Reference the Properties inherited from Tags and their respective Values as well...
        public ICollection<PropertyValue> PropertyValues { get; set; }
    }
}
