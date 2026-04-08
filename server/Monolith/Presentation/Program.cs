using System.Text;
using Application.Modules.Auth.Authorization;
using Application.Modules.Audit.Interfaces;
using Application.Modules.Audit.Services;
using Application.Modules.Auth.Interfaces;
using Application.Modules.Auth.Services;
using Application.Modules.Bookings.Interfaces;
using Application.Modules.Bookings.Services;
using Application.Modules.Clients.Interfaces;
using Application.Modules.Clients.Services;
using Application.Modules.Payments.Interfaces;
using Application.Modules.Payments.Services;
using Application.Modules.Recommendations.Interfaces;
using Application.Modules.Recommendations.Services;
using Application.Modules.Services.Interfaces;
using Application.Modules.Services.Services;
using Application.Modules.Tours.Interfaces;
using Application.Modules.Tours.Services;
using Application.Modules.Users.Interfaces;
using Application.Modules.Users.Services;
using Infrastructure;
using Infrastructure.Modules.Audit.Repositories;
using Infrastructure.Modules.Auth.Repositories;
using Infrastructure.Modules.Auth.Seeding;
using Infrastructure.Modules.Auth.Security;
using Infrastructure.Modules.Bookings.Messaging;
using Infrastructure.Modules.Clients.Repositories;
using Infrastructure.Modules.Payments.Repositories;
using Infrastructure.Modules.Recommendations.Storage;
using Infrastructure.Modules.Services.Repositories;
using Infrastructure.Modules.Tours.Repositories;
using MassTransit;
using MeTravel.Contracts.Bookings;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Presentation.Middleware;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("Default");
var jwtSecret = builder.Configuration["Jwt:Secret"] ?? throw new InvalidOperationException("Jwt:Secret is not configured.");
var rabbitMqHost = builder.Configuration["RabbitMq:Host"] ?? "localhost";
var rabbitMqPort = ushort.TryParse(builder.Configuration["RabbitMq:Port"], out var rabbitMqPortValue) ? rabbitMqPortValue : (ushort)5672;
var rabbitMqVirtualHost = builder.Configuration["RabbitMq:VirtualHost"] ?? "/";
var rabbitMqUsername = builder.Configuration["RabbitMq:Username"] ?? "guest";
var rabbitMqPassword = builder.Configuration["RabbitMq:Password"] ?? "guest";
var recommendationModelRelativePath = builder.Configuration["Ai:RecommendationModelPath"] ?? "App_Data/ai/tour-recommendation-model.json";
var recommendationModelPath = Path.IsPathRooted(recommendationModelRelativePath)
    ? recommendationModelRelativePath
    : Path.Combine(builder.Environment.ContentRootPath, recommendationModelRelativePath);

builder.Services.AddDbContext<MeTravelDbContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret))
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(AuthorizationPolicies.AdminOnly, policy =>
        policy.RequireRole(AppRoles.Admin));

    options.AddPolicy(AuthorizationPolicies.StaffOnly, policy =>
        policy.RequireRole(AppRoles.Admin, AppRoles.Operator));
});

builder.Services.AddScoped<ITourRepository, TourRepository>();
builder.Services.AddScoped<ITourService, TourService>();
builder.Services.AddScoped<IBookingCommandService, BookingCommandService>();
builder.Services.AddScoped<IBookingEventPublisher, BookingEventPublisher>();
builder.Services.AddScoped<IClientRepository, ClientRepository>();
builder.Services.AddScoped<IClientService, ClientService>();
builder.Services.AddScoped<IPaymentRepository, PaymentRepository>();
builder.Services.AddScoped<IPaymentService, PaymentService>();
builder.Services.AddSingleton<IRecommendationModelStore>(serviceProvider =>
    new JsonRecommendationModelStore(
        recommendationModelPath,
        serviceProvider.GetRequiredService<ILogger<JsonRecommendationModelStore>>()));
builder.Services.AddScoped<IRecommendationService, RecommendationService>();
builder.Services.AddScoped<IServiceRepository, ServiceRepository>();
builder.Services.AddScoped<IServiceService, ServiceService>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUserManagementService, UserManagementService>();
builder.Services.AddScoped<IPasswordHasherService, PasswordHasherService>();
builder.Services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();
builder.Services.AddScoped<IAuditRepository, AuditRepository>();
builder.Services.AddScoped<IAuditService, AuditService>();
builder.Services.AddScoped<AdminUserSeeder>();

builder.Services.AddMassTransit(x =>
{
    x.UsingRabbitMq((context, cfg) =>
    {
        cfg.Host(rabbitMqHost, rabbitMqPort, rabbitMqVirtualHost, h =>
        {
            h.Username(rabbitMqUsername);
            h.Password(rabbitMqPassword);
        });
    });
});

builder.Services.AddControllers();

// Swagger / OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "MeTravel API",
        Version = "v1"
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter JWT token"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<MeTravelDbContext>();
    await dbContext.Database.MigrateAsync();

    var adminSeeder = scope.ServiceProvider.GetRequiredService<AdminUserSeeder>();
    await adminSeeder.SeedAsync();

    var recommendationLogger = scope.ServiceProvider
        .GetRequiredService<ILoggerFactory>()
        .CreateLogger("RecommendationModelStartup");

    try
    {
        var recommendationModelStore = scope.ServiceProvider.GetRequiredService<IRecommendationModelStore>();
        await recommendationModelStore.LoadAsync();
    }
    catch (Exception exception)
    {
        recommendationLogger.LogError(exception, "Не удалось загрузить модель рекомендаций при старте приложения.");
    }
}

// Глобальная обработка необработанных исключений
app.UseMiddleware<GlobalExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
