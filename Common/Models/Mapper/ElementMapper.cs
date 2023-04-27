using Models.Entities;

using Shared.Dtos;

namespace Shared.Mapper
{
    public static class ElementMapper
    {
        public static MongoElementDto ToMongoDto(this Element element)
        {
            if (element == null)
                return null;

            return new MongoElementDto()
            {
                Id = element.Id,
                MongoId = element.MongoId,

                GlobalName = element.GlobalName,

                Manufacturer = element.Manufacturer,
                Distributor = element.Distributor,

                Description = element.Description,
                PictureUri = element.PictureUri,
                Url = element.Url
            };
        }

        public static Element ToModel(this MongoElementDto elementDto)
        {
            return new Element()
            {
                Id = elementDto.Id,
                MongoId = elementDto.MongoId,

                GlobalName = elementDto.GlobalName,

                Manufacturer = elementDto.Manufacturer,
                Distributor = elementDto.Distributor,
                Description = elementDto.Description,
                PictureUri = elementDto.PictureUri,
                Url = elementDto.Url
            };
        }
    }
}
