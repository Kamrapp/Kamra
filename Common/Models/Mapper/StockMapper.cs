using Models.Entities;

using Shared.Dtos;

namespace Shared.Mapper
{
    public static class StockMapper
    {
        public static MongoStockDto ToMongoDto(this BaseOffer offer)
        {
            if (offer == null)
                return null;

            return new MongoStockDto()
            {
                ApiId = offer.ApiId,
                MongoId = offer.Id.ToString(),
                Currency = offer.Currency,
                ElementId = offer.ElementId,
                Price = offer.Price,
                MongoShop = offer.MongoShop,
                MongoProductId = offer.ProductKey,
                OriginalPrice = offer.OriginalPrice,
                Unit = offer.Unit,
                Url = offer.Url,
                ValidFrom = offer.ValidFrom.ToDateTime(TimeOnly.MinValue),
                ValidTill = offer.ValidTo.ToDateTime(TimeOnly.MaxValue)
            };
        }

        public static MongoStockDto ToMongoDto(this Stock stock)
        {
            if (stock == null)
                return null;

            return new MongoStockDto()
            {
                ApiId = stock.Id,
                MongoId = stock.MongoId,
                Currency = stock.Currency,
                ElementId = stock.ElementId,
                MongoProductId = stock.MongoProductId,
                OriginalPrice = stock.OriginalPrice,
                Unit = stock.Unit,
                MongoShop = stock.Shop?.Name,
                Price = (decimal)stock.Price,
                Url = stock.Url,
                ValidTill = stock.ValidTill,
                ValidFrom = stock.ValidFrom
            };
        }

        public static Stock ToModel(this MongoStockDto stockDto)
        {
            return new Stock()
            {
                MongoId = stockDto.MongoId,
                MongoProductId = stockDto.MongoProductId,
                Price = (double)stockDto.Price,
                Unit = stockDto.Unit,
                ValidFrom = stockDto.ValidFrom,
                ValidTill = stockDto.ValidTill,
                Currency = stockDto.Currency,
                Url = stockDto.Url
            };
        }

        public static BaseOffer ToMongoOffer(this MongoStockDto stockDto)
        {
            return new BaseOffer()
            {
                ApiId = stockDto.ApiId,
                ProductKey = stockDto.MongoProductId,
                Url = stockDto.Url,
                ValidFrom = DateOnly.FromDateTime(stockDto.ValidFrom),
                ValidTo = DateOnly.FromDateTime(stockDto.ValidTill),
                Currency = stockDto.Currency,
                MongoShop = stockDto.MongoShop,
                OriginalPrice = stockDto.OriginalPrice,
                Price = stockDto.Price,
                Unit = stockDto.Unit,
                ElementId = stockDto.ElementId,
            };
        }
    }
}
