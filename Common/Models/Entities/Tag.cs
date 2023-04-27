using System.ComponentModel.DataAnnotations;

namespace Models.Entities
{
    public class Tag
    {
        public Tag()
        {
            Properties = new List<Property>();
            Tag2Tags = new List<Tag2Tag>();
            ParentTag2Tags = new List<Tag2Tag>();
            Element2Tags = new List<Element2Tag>();
        }
        [Key]
        public int Id { get; set; }
        [Required]
        public string Name { get; set; }
        public ICollection<Property> Properties { get; set; }
        // All Tags can have multiple Parents that are effective on the owner of the tag as well
        public ICollection<Tag2Tag> Tag2Tags { get; set; }
        public ICollection<Tag2Tag> ParentTag2Tags { get; set; }
        public ICollection<Element2Tag> Element2Tags { get; set; }

    }
}
