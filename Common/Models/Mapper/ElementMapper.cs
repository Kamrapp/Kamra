using Models.Entities;

using Shared.Dtos;

namespace Shared.Mapper
{
    public static class ElementMapper
    {
        public static ElementDto ToDto(this Element element)
        {
            if (element == null)
                return null;

            return new ElementDto()
            {
                Id = element.Id
            };
        }

        public static Element ToModel(this ElementDto elementDto)
        {
            return new Element()
            {
                Id = elementDto.Id
            };
        }
    }
}
