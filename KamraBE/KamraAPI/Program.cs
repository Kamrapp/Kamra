using DataAccess.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace KamraAPI
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);
            builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer(opt =>
                {
                    opt.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters()
                    {
                        ValidateIssuer = true,
                        ValidateAudience = true,
                        ValidateLifetime = true,
                        ValidateIssuerSigningKey = true,
                        ValidIssuer = builder.Configuration["Jwt:Issuer"],
                        ValidAudience = builder.Configuration["Jwt:Audience"],
                        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]))
                    };
                });

            builder.Services.AddControllers();
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();

            var connectionString = builder.Configuration.GetConnectionString("test");

            // Use dotnet Secret to overwrite connectionString "below" AppSettings data with your own value!
            //var connectionString = "Data Source=DESKTOP-KT33QNU\\SQLDEVELOPER;Initial Catalog=Kamra;Integrated Security=True";

            if (connectionString == null)
                throw new ArgumentException("Default connectionstring is missing");

            builder.Services.AddDbContext<ApplicationDbContext>(options =>
                options.UseSqlServer(connectionString));//, contextLifetime: ServiceLifetime.Singleton);

            builder.Services.AddMvc();

            builder.Services.AddCors();

            // This is where dependency injected services are
            builder.Services.RegisterCustomServices();

            var app = builder.Build();

            app.UseCors(x =>
            {
                x.WithOrigins("http://localhost:4200")
                //.AllowAnyOrigin()
                .AllowAnyMethod()
                .AllowCredentials()
                .AllowAnyHeader();
            });

            // Configure the HTTP request pipeline.
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            app.UseHttpsRedirection();

            app.UseAuthentication();

            app.UseAuthorization();

            app.MapControllers();

            //app.UseEndpoints(eps =>
            //{
            //    eps.MapControllers();
            //});

            app.Run();
        }
    }
}