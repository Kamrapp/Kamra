using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Models.Entities
{
    public class PropertyValue
    {
        public PropertyValue()
        {
        }

        [Required]
        [ForeignKey(nameof(Property))]
        public int PropertyId { get; set; }
        public virtual Property? Property { get; set; }

        [NotMapped]
        public object? Value
        {
            get
            {
                return Property.ValueListType switch
                {
                    Property.EValueListType.Unset => null,
                    Property.EValueListType.Bool => Bool,
                    Property.EValueListType.String => String,
                    Property.EValueListType.Int => Int,
                    Property.EValueListType.Double => Double,
                    _ => throw new NotImplementedException(),
                };
            }
            set
            {
                switch (Property.ValueListType)
                {
                    case Property.EValueListType.Unset: break;
                    case Property.EValueListType.Bool: Bool = (bool?)Value; break;
                    case Property.EValueListType.String: String = (string?)Value; break;
                    case Property.EValueListType.Int: Int = (int?)Value; break;
                    case Property.EValueListType.Double: Double = (double?)Value; break;
                    default:
                        throw new NotImplementedException();
                }
            }
        }

        public bool? Bool { set; get; }
        public string? String { set; get; }
        public int? Int { set; get; }
        public double? Double { set; get; }
    }
}
