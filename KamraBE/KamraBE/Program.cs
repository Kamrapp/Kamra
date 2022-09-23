using DataAccess.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace KamraBE
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            builder.Services.AddControllers();
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();

            var connectionString = builder.Configuration.GetConnectionString("default");

            // Use dotnet Secret to overwrite connectionString "below" AppSettings data with your own value!
            //var connectionString = "Data Source=DESKTOP-KT33QNU\\SQLDEVELOPER;Initial Catalog=Kamra;Integrated Security=True";

            builder.Services.AddDbContext<ApplicationDbContext>(options =>
                options.UseSqlServer(connectionString));

            builder.Services.AddMvc();

            builder.Services.AddCors();

            // This is where dependency injected services are
            builder.Services.RegisterCustomServices();

            var app = builder.Build();

            app.UseCors(x =>
            {
                x.WithOrigins("http://localhost:4200").AllowAnyMethod().AllowAnyHeader();
            });

            // Configure the HTTP request pipeline.
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            app.UseHttpsRedirection();

            app.UseAuthorization();


            app.MapControllers();

            app.Run();
        }
    }
}