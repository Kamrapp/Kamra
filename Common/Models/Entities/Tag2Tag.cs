using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Models.Entities
{
    public class Tag2Tag
    {
        public Tag2Tag()
        {
            PropertyValues = new List<PropertyValue>();
        }

        [Required]
        [ForeignKey(nameof(ParentTag))]
        public int ParentTagId { get; set; }
        public virtual Tag ParentTag { get; set; }

        [Required]
        [ForeignKey(nameof(ChildTag))]
        public int ChildTagId { get; set; }
        public virtual Tag ChildTag { get; set; }


        [Range(-10000, 10000,
        ErrorMessage = "Value for {0} must be between {1} and {2}.")]
        public double Weight { get; set; }

        // TODO: PropertyValues need to Reference the Properties inherited from Tags and their respective Values as well...
        public ICollection<PropertyValue> PropertyValues { get; set; }

    }
}
