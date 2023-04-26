using BusinessLogicService.TestService;

namespace KamraBE
{
    public static class RegisterServices
    {
        public static void RegisterCustomServices(this IServiceCollection services )
        {
            services.AddSingleton<ITestService,TestService>();
        }
    }
}
