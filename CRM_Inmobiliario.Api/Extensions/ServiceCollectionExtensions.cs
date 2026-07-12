using System.Text.Json.Serialization;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Npgsql;
using FluentValidation;

namespace CRM_Inmobiliario.Api.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddProjectInfrastructure(this IServiceCollection services, IConfiguration configuration, IWebHostEnvironment environment)
    {
        // Caché en memoria (Telemetría de Seguridad)
        services.AddMemoryCache();

        // Data Protection persistida en PostgreSQL (Railway-safe).
        // Las claves sobreviven a reinicios y redeployments del contenedor,
        // eliminando rotaciones de clave no deseadas y cierres de sesión inesperados.
        services.AddDataProtection()
            .SetApplicationName("CRM_Inmobiliario_Profesional")
            .PersistKeysToDbContext<CrmDbContext>();
        services.Configure<CRM_Inmobiliario.Api.Features.Shared.Settings.LLMSettings>(
            configuration.GetSection(CRM_Inmobiliario.Api.Features.Shared.Settings.LLMSettings.SectionName));

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
        }, ServiceLifetime.Scoped, ServiceLifetime.Singleton);

        services.AddDbContextFactory<CrmDbContext>(options => 
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

        // FluentValidation
        services.AddValidatorsFromAssemblyContaining<Program>();

        return services;
    }

    public static IServiceCollection AddProjectAuthentication(this IServiceCollection services, IConfiguration configuration)
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
                    ClockSkew = TimeSpan.FromMinutes(5)
                };
                options.Events = new JwtBearerEvents
                {
                    OnMessageReceived = context =>
                    {
                        var accessToken = context.Request.Query["access_token"];
                        
                        if (!string.IsNullOrEmpty(accessToken))
                        {
                            // Guardar en cookie para que los assets (css, js) y la navegación funcionen
                            context.Response.Cookies.Append("hangfire_token", accessToken.ToString(), new CookieOptions { HttpOnly = true, Secure = true });
                        }
                        else
                        {
                            accessToken = context.Request.Cookies["hangfire_token"];
                        }

                        var path = context.HttpContext.Request.Path;
                        if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hangfire"))
                        {
                            context.Token = accessToken;
                        }
                        return Task.CompletedTask;
                    }
                };
            });

        services.AddAuthorization(options =>
        {
            options.AddPolicy("AdminPolicy", policy =>
            {
                policy.RequireAssertion(context =>
                {
                    var appMetadataClaim = context.User.FindFirst("app_metadata")?.Value;
                    if (string.IsNullOrEmpty(appMetadataClaim)) return false;
                    try
                    {
                        using var doc = System.Text.Json.JsonDocument.Parse(appMetadataClaim);
                        return doc.RootElement.TryGetProperty("role", out var roleElement) && roleElement.GetString() == "Admin";
                    }
                    catch
                    {
                        return false;
                    }
                });
            });
        });
        var frontendUrl = configuration["FrontendUrl"] ?? Environment.GetEnvironmentVariable("FrontendUrl") ?? "http://localhost:5173";

        // Permitir ambas variantes (http y https) para cubrir dev local con y sin SSL
        var allowedOrigins = new[] { frontendUrl, frontendUrl.Replace("http://", "https://"), frontendUrl.Replace("https://", "http://") }
            .Distinct()
            .ToArray();

        services.AddCors(options => options.AddDefaultPolicy(p =>
            p.WithOrigins(
                allowedOrigins.Concat(new[] { "http://localhost:3000", "https://zielluxoracrm.com" }).ToArray()
            ).AllowAnyMethod().AllowAnyHeader()));


        return services;
    }
}
