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

        public WeatherForecastController(
            ILogger<WeatherForecastController> logger, 
            ITestService testService)
        {
            _logger = logger;
            _testService = testService;
        }

        [HttpGet]
        [Route("forecasts")]
        public async Task<IActionResult> Get()
        {
            return Ok(_testService.GetWeatherForecasts());
        }
    }
}