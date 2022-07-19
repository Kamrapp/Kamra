using System.ComponentModel.DataAnnotations;

namespace DataAccess.Models
{
    public class Property
    {
        public Property()
        {
            Type = EType.Unset;
            ValueListType = PropertyValue.EType.Unset;
            PropertyValues = new List<PropertyValue>();
        }

        public enum EType
        {
            Unset,
            Bool,
            String,
            Int,
            Double,
            ValueList
        }

        [Key]
        public int Id { get; set; }
        [Required]
        public string Name { get; set; }
        public EType Type { get; set; }

        public PropertyValue.EType ValueListType { get; set; }
        public ICollection<PropertyValue> PropertyValues { get; set; }

    }
}