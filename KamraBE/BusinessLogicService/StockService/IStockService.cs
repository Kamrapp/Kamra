namespace BusinessLogicService.StockService
{
    public interface IStockService
    {
        public Task<MongoStockDto> GetStock(string mongoId);
        public Task<MongoStockDto> GetStock(int id);
        public Task<IEnumerable<MongoStockDto>> GetAllStocks();
        public Task<MongoStockDto> CreateStock(MongoStockDto stockDto);

    }
}
