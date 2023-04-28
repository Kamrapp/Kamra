using Models.Entities;

using Shared.Dtos;

namespace Shared.Mapper
{
    public static class ElementMapper
    {
        public static MongoElementDto ToMongoDto(this BaseProduct product)
        {
            if (product == null)
                return null;

            return new MongoElementDto()
            {
                ApiId = product.ApiId,
                MongoId = product.Id.ToString(),

                DistributorKey = product.Key,
                GlobalName = product.Name,

                Manufacturer = product.BrandName,

                Description = product.Description,
                PictureUri = product.PictureUri,
                Url = product.Url
            };
        }

        public static MongoElementDto ToMongoDto(this Element element)
        {
            if (element == null)
                return null;

            return new MongoElementDto()
            {
                ApiId = element.Id,
                MongoId = element.MongoId,

                GlobalName = element.GlobalName,

                Manufacturer = element.Manufacturer,
                Distributor = element.Distributor,
                DistributorKey = element.DistributorKey,

                Description = element.Description,
                PictureUri = element.PictureUri,
                Url = element.Url
            };
        }

        public static Element ToModel(this MongoElementDto elementDto)
        {
            return new Element()
            {
                MongoId = elementDto.MongoId,

                GlobalName = elementDto.GlobalName,

                Manufacturer = elementDto.Manufacturer,
                Distributor = elementDto.Distributor,
                DistributorKey = elementDto.DistributorKey,
                Description = elementDto.Description,
                PictureUri = elementDto.PictureUri,
                Url = elementDto.Url
            };
        }

        public static BaseProduct ToMongoProduct(this MongoElementDto elementDto)
        {
            return new BaseProduct()
            {
                ApiId = elementDto.ApiId,

                Name = elementDto.GlobalName,

                BrandName = elementDto.Manufacturer,
                Distributor = elementDto.Distributor,
                Key = elementDto.DistributorKey,
                Description = elementDto.Description,
                PictureUri = elementDto.PictureUri,
                Url = elementDto.Url
            };
        }
    }
}
