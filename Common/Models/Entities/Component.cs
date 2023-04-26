using System.ComponentModel.DataAnnotations;

namespace Models.Entities
{
    public class Component
    {
        public Component()
        {
        }

        [Required]
        public int ParentElementId { get; set; }
        public virtual Element ParentElement { get; set; }

        [Required]
        public int ChildElementId { get; set; }
        public virtual Element ChildElement { get; set; }


        [Range(0, 1,
        ErrorMessage = "Value for {0} must be between {1} and {2}.")]
        public double Ratio { get; set; }

    }

}
