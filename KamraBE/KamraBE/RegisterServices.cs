using BusinessLogicService.EmailService;
using BusinessLogicService.TestService;
using BusinessLogicService.UserService;

namespace KamraBE
{
    public static class RegisterServices
    {
        public static void RegisterCustomServices(this IServiceCollection services )
        {
            services.AddScoped<ITestService,TestService>();
            services.AddScoped<IUserService,UserService>();
            services.AddScoped<IEmailService,EmailService>();
        }
    }
}
