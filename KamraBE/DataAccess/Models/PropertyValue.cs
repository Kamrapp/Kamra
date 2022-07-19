using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DataAccess.Models
{
    public class PropertyValue
    {
        public PropertyValue()
        {
            Type = EType.Unset;
        }
        public enum EType
        {
            Unset,
            Bool,
            String,
            Int,
            Double
        }

        [Required]
        [ForeignKey(nameof(Property))]
        public int PropertyId { get; set; }
        public virtual Property? Property { get; set; }


        public EType Type
        {
            get;
            /*
                {
                    return
                        Bool != null ? EType.Bool
                      : String != null ? EType.String
                      : Int != null ? EType.Int
                      : Double != null ? EType.Double
                      : EType.Unset;
                }
            */
            private set;
            /*
                { 
                }
            */
        }

        public object? Value
        {
            get
            {
                switch (Type)
                {
                    case EType.Unset:
                        return null;
                    case EType.Bool:
                        return Bool;
                    case EType.String:
                        return String;
                    case EType.Int:
                        return Int;
                    case EType.Double:
                        return Double;
                    default:
                        throw new NotImplementedException();
                }
            }
        }


        #region Variable value members
        bool? _bool = null;
        public bool? Bool
        {
            get { return _bool; }
            set { _bool = value; Type = EType.Bool; }
        }

        string? _string = null;
        public string? String
        {
            get => _string;
            set { _string = value; Type = EType.String; }
        }

        int? _int = null;
        public int? Int
        {
            get { return _int; }
            set { _int = value; Type = EType.Int; }
        }

        double? _double = null;
        public double? Double
        {
            get { return _double; }
            set { _double = value; Type = EType.Double; }
        }
        #endregion Variable value members

    }
}
