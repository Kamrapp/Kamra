using BusinessLogicService.TestService;
using DataAccess.Data;
using Microsoft.AspNetCore.Mvc;
using Shared.Dtos;

namespace KamraBE.Controllers
{
    [ApiController]
    [Route("api/test/")]
    public class WeatherForecastController : ControllerBase
    {
        private readonly ILogger<WeatherForecastController> _logger;

        private readonly ITestService _testService;

        private readonly ApplicationDbContext _context;
        public WeatherForecastController(
            ILogger<WeatherForecastController> logger, 
            ITestService testService,
            ApplicationDbContext context)
        {
            _logger = logger;
            _testService = testService;
            _context = context;
        }

        [HttpGet]
        [Route("forecasts")]
        public async Task<IActionResult> Get()
        {
            return Ok(_testService.GetWeatherForecasts());
        }
    }
}