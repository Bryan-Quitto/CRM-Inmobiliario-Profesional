using System.Text.Json.Serialization;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Npgsql;

namespace CRM_Inmobiliario.Api.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddProjectInfrastructure(this IServiceCollection services, IConfiguration configuration, IWebHostEnvironment environment)
    {
        // JSON Options
        services.ConfigureHttpJsonOptions(options => {
            options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
            options.SerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        });

        // Database
        var connectionString = Environment.GetEnvironmentVariable("DATABASE_URL");
        var dataSourceBuilder = new Npgsql.NpgsqlDataSourceBuilder(connectionString);
        dataSourceBuilder.UseVector();
        var dataSource = dataSourceBuilder.Build();

        services.AddDbContext<CrmDbContext>(options => 
        {
            options.UseNpgsql(dataSource, npgsqlOptions => 
            {
                npgsqlOptions.UseVector();
                npgsqlOptions.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery);
                npgsqlOptions.EnableRetryOnFailure(5, TimeSpan.FromSeconds(30), null);
            });

            if (environment.IsDevelopment())
            {
                options.EnableDetailedErrors();
                options.EnableSensitiveDataLogging();
            }
        });

        // Supabase Client
        var supabaseUrl = Environment.GetEnvironmentVariable("SUPABASE_URL");
        var supabaseRoleKey = Environment.GetEnvironmentVariable("SUPABASE_ROLE_KEY");

        if (string.IsNullOrEmpty(supabaseUrl) || string.IsNullOrEmpty(supabaseRoleKey))
        {
            throw new InvalidOperationException("Las variables de entorno SUPABASE_URL y SUPABASE_ROLE_KEY son obligatorias.");
        }

        services.AddScoped(_ => new Supabase.Client(
            supabaseUrl,
            supabaseRoleKey,
            new Supabase.SupabaseOptions { AutoConnectRealtime = true }
        ));

        // QuestPDF
        QuestPDF.Settings.License = QuestPDF.Infrastructure.LicenseType.Community;

        return services;
    }

    public static IServiceCollection AddProjectAuthentication(this IServiceCollection services)
    {
        var supabaseUrl = Environment.GetEnvironmentVariable("SUPABASE_URL");

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.Authority = $"{supabaseUrl}/auth/v1";
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = $"{supabaseUrl}/auth/v1",
                    ValidateAudience = true,
                    ValidAudience = "authenticated",
                    ValidateIssuerSigningKey = true,
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero
                };
            });

        services.AddAuthorization(options =>
        {
            options.AddPolicy("AdminOnly", policy =>
            {
                policy.RequireAssertion(context =>
                    context.User.HasClaim(c => c.Type == "sub" && c.Value == "d4a6efdd-b801-40fb-901e-64e36f6b1400") ||
                    context.User.HasClaim(c => c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier" && c.Value == "d4a6efdd-b801-40fb-901e-64e36f6b1400"));
            });
        });
        services.AddCors(options => options.AddDefaultPolicy(p => p.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader()));

        return services;
    }
}
