namespace BusinessLogicService.TestService
{
    public interface ITestService
    {
        public IEnumerable<WeatherForecastDto> GetWeatherForecasts();
    }
}
