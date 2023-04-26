using System.ComponentModel.DataAnnotations;

namespace Models.Entities
{
    public class Element
    {
        public Element()
        {
            Components = new List<Component>();
            ParentComponents = new List<Component>();
            Element2Tags = new List<Element2Tag>();
            Stocks = new List<Stock>();

            TagList = string.Empty;
        }

        [Key]
        public int Id { get; set; }
        [Required]
        public string GlobalName { get; set; }

        [Range(0, 1000000000000000,
        ErrorMessage = "Value for {0} must be between {1} and {2}.")]
        public int GTIN { get; set; }

        //TODO: Needs proper class
        public string? Manufacturer { get; set; }

        // Element2Element are parts of the Element with a certain Ratio
        public ICollection<Component> Components { get; set; }
        public ICollection<Component> ParentComponents { get; set; }

        // Element2Tag Connect Elements with Tags with a certain Weight
        public ICollection<Element2Tag> Element2Tags { get; set; }

        // All Tags and PropertyValues are stored here redundantly for faster inquisition
        public string TagList { get; set; }


        public ICollection<Stock> Stocks { get; set; }
    }


}
