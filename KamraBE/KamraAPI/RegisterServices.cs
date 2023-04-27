using BusinessLogicService.ElementService;
using BusinessLogicService.EmailService;
using BusinessLogicService.TestService;
using BusinessLogicService.UserService;

namespace KamraAPI
{
    public static class RegisterServices
    {
        public static void RegisterCustomServices(this IServiceCollection services)
        {
            services.AddSingleton<ITestService, TestService>();
            services.AddScoped<IUserService, UserService>();
            services.AddScoped<IEmailService, EmailService>();
            services.AddScoped<IElementService, ElementService>();
        }
    }
}
