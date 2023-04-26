using System.ComponentModel.DataAnnotations;

namespace Models.Entities
{
    public class Property
    {
        public Property()
        {
            PropertyType = EPropertyType.Unset;
            ValueListType = EValueListType.Unset;
            PropertyValues = new List<PropertyValue>();
        }

        public enum EPropertyType
        {
            Unset,
            Bool,
            String,
            Int,
            Double,
            ValueList
        }

        public enum EValueListType
        {
            Unset,
            Bool,
            String,
            Int,
            Double
        }

        [Key]
        public int Id { get; set; }
        [Required]
        public string Name { get; set; }
        public EPropertyType PropertyType { get; set; }

        public EValueListType ValueListType { get; set; }
        public ICollection<PropertyValue> PropertyValues { get; set; }

    }
}