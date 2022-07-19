using Shared.Dtos;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BusinessLogicService.TestService
{
    public interface ITestService
    {
        public IEnumerable<WeatherForecastDto> GetWeatherForecasts();
    }
}
