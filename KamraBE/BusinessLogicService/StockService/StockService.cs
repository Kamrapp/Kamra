
namespace BusinessLogicService.StockService
{
    public class StockService : IStockService
    {
        private readonly ApplicationDbContext _context;
        public StockService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<MongoStockDto> GetStock(string mongoId)
        {
            try
            {
                var stock = await _context.Stocks.FirstOrDefaultAsync(x => x.MongoId == mongoId);
                // todo if not exists throw an error
                if (stock == null) return null;

                return stock?.ToMongoDto();
            }
            catch (NullReferenceException ne)
            {
                // TODO logger
                return null;
            }
            catch (TimeoutException te)
            {
                return null;
            }
        }
        public async Task<MongoStockDto> GetStock(int id)
        {
            try
            {
                var stock = await _context.Stocks.FirstOrDefaultAsync(x => x.Id == id);
                // todo if not exists throw an error
                if (stock == null) return null;

                return stock?.ToMongoDto();
            }
            catch (NullReferenceException ne)
            {
                // TODO logger
                return null;
            }
            catch (TimeoutException te)
            {
                return null;
            }
        }
        public async Task<IEnumerable<MongoStockDto>> GetAllStocks()
        {
            try
            {
                var stockDtos = _context.Stocks.Select(x => x.ToMongoDto()).ToList();
                return stockDtos;
            }
            catch (NullReferenceException ne)
            {
                // TODO logger
                return null;
            }
            catch (TimeoutException te)
            {
                return null;
            }
        }

        public async Task<MongoStockDto> CreateStock(MongoStockDto stockDto)
        {
            try
            {
                var stockAlreadyExists = await _context.Stocks.AnyAsync(x => x.MongoId == stockDto.MongoId.ToString());

                //TODO: fix handling existence
                if (stockAlreadyExists)
                    throw new InvalidDataException("Stock to be created already exists");

                var element = await _context.Elements.FirstOrDefaultAsync(x => x.Id == stockDto.ElementId);
                if (element == null)
                    throw new InvalidDataException("Stock to be created requires existing element from MongoProductId");

                var shop = await _context.Shops.FirstOrDefaultAsync(x => x.Name == stockDto.MongoShop);
                if (shop == null)
                    throw new InvalidDataException("Stock to be created requires existing shop for MongoShop");

                var newStock = stockDto.ToModel();
                newStock.Element = element;
                newStock.Shop = shop;

                _context.Stocks.Add(newStock);

                var result = await _context.SaveChangesAsync();

                return result > 0 ? newStock.ToMongoDto() : null;
            }
            catch (NullReferenceException ne)
            {
                return null;
            }
            catch (TimeoutException te)
            {
                return null;
            }
            catch (DbUpdateException dbex)
            {
                return null;
            }
        }
    }
}
