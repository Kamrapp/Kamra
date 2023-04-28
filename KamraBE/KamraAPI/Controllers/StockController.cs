using BusinessLogicService.StockService;

using Microsoft.AspNetCore.Authorization;

namespace KamraAPI.Controllers
{
    [ApiController]
    [Route("api/stock/")]
    public class StockController : Controller
    {
        private readonly IStockService _stockService;

        public StockController(IStockService stockService)
        {
            _stockService = stockService;
        }

        [AllowAnonymous]
        [HttpPost]
        [Route(nameof(Create))]
        public async Task<IActionResult> Create([FromBody] MongoStockDto stockDto)
        {
            try
            {
                var stock = await _stockService.CreateStock(stockDto);

                return Ok(stock);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [AllowAnonymous]
        [HttpPost]
        [Route(nameof(Get))]
        public async Task<IActionResult> Get([FromBody] string mongoId)
        {
            try
            {
                var stock = await _stockService.GetStock(mongoId);

                return Ok(stock);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [AllowAnonymous]
        [HttpPost]
        [Route(nameof(GetById))]
        public async Task<IActionResult> GetById([FromBody] int id)
        {
            try
            {
                var stock = await _stockService.GetStock(id);

                return Ok(stock);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [AllowAnonymous]
        [HttpGet]
        [Route(nameof(GetAll))]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var stocks = await _stockService.GetAllStocks();

                return Ok(stocks);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
