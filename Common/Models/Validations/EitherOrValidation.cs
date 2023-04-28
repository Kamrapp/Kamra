using System.ComponentModel.DataAnnotations;
using System.Reflection;

public class EitherOrAttribute : ValidationAttribute
{
    private readonly string[] _propertyNames;

    public EitherOrAttribute(params string[] propertyNames)
    {
        _propertyNames = propertyNames;
    }

    protected override ValidationResult IsValid(object value, ValidationContext validationContext)
    {
        PropertyInfo[] properties;

        object? notNullPropertyValue = null;
        foreach (var propertyName in _propertyNames)
        {
            var property = validationContext.ObjectType.GetProperty(propertyName);
            if (property == null)
                return new ValidationResult($"Unknown property {propertyName}");

            var propertyValue = property.GetValue(validationContext.ObjectInstance);
            if (notNullPropertyValue != null)
                return new ValidationResult($"Only one of given properties can be set");

            notNullPropertyValue = propertyValue;
        }

        if (notNullPropertyValue == null)
            return new ValidationResult($"None of required properties is set");

        return ValidationResult.Success;
    }
}