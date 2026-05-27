using System.Text;
using Application.Modules.Auth.Authorization;
using Application.Modules.Auth.Interfaces;
using Application.Modules.Auth.Services;
using Application.Modules.Bookings.Interfaces;
using Application.Modules.Bookings.Services;
using Application.Modules.Audit.Interfaces;
using Application.Modules.Audit.Services;
using Application.Modules.Clients.Interfaces;
using Application.Modules.Clients.Services;
using Application.Modules.Messaging.Interfaces;
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
using Infrastructure.Modules.Messaging;
using Infrastructure.Modules.Audit.Repositories;
using Infrastructure.Modules.Auth.Repositories;
using Infrastructure.Modules.Auth.Security;
using Infrastructure.Modules.Auth.Seeding;
using Infrastructure.Modules.Bookings.Messaging;
using Infrastructure.Modules.Clients.Repositories;
using Infrastructure.Modules.Payments.Repositories;
using Infrastructure.Modules.Recommendations.Storage;
using Infrastructure.Modules.Services.Repositories;
using Infrastructure.Modules.Tours.Repositories;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Presentation.Middleware;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("Default");

builder.Services.AddDbContext<MeTravelDbContext>(options =>
    options.UseNpgsql(connectionString));

var jwtSecret = builder.Configuration["Jwt:Secret"] ?? "super-secret-development-key-change-me-2026";

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
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "MeTravel",
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? "MeTravel.Clients",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret))
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(
        AuthorizationPolicies.StaffOnly,
        policy => policy.RequireRole(AppRoles.Admin, AppRoles.Operator));

    options.AddPolicy(
        AuthorizationPolicies.AdminOnly,
        policy => policy.RequireRole(AppRoles.Admin));
});

builder.Services.AddScoped<ITourRepository, TourRepository>();
builder.Services.AddScoped<ITourService, TourService>();
builder.Services.AddScoped<IClientRepository, ClientRepository>();
builder.Services.AddScoped<IClientService, ClientService>();
builder.Services.AddScoped<IAuditRepository, AuditRepository>();
builder.Services.AddScoped<IAuditService, AuditService>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IPaymentRepository, PaymentRepository>();
builder.Services.AddScoped<IPaymentService, PaymentService>();
builder.Services.AddScoped<IBookingEventPublisher, BookingEventPublisher>();
builder.Services.AddScoped<IBookingCommandService, BookingCommandService>();
builder.Services.AddScoped<IUserManagementService, UserManagementService>();
builder.Services.AddScoped<IServiceRepository, ServiceRepository>();
builder.Services.AddScoped<IServiceService, ServiceService>();
builder.Services.AddScoped<IPasswordHasherService, PasswordHasherService>();
builder.Services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();
builder.Services.AddScoped<AdminUserSeeder>();
builder.Services.AddSingleton<IRabbitMqPublisher, RabbitMqPublisher>();
builder.Services.AddSingleton<IRecommendationModelStore>(serviceProvider =>
{
    var modelPath = builder.Configuration["Ai:RecommendationModelPath"]
        ?? Path.Combine("App_Data", "ai", "tour-recommendation-model.json");

    return new JsonRecommendationModelStore(
        modelPath,
        serviceProvider.GetRequiredService<ILogger<JsonRecommendationModelStore>>());
});
builder.Services.AddScoped<IRecommendationService, RecommendationService>();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "MeTravel API",
        Version = "v1"
    });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<MeTravelDbContext>();
    await dbContext.Database.EnsureCreatedAsync();

    var adminUserSeeder = scope.ServiceProvider.GetRequiredService<AdminUserSeeder>();
    await adminUserSeeder.SeedAsync();
}
app.UseMiddleware<GlobalExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/health", () => Results.Ok(new { status = "ok" }));
app.MapControllers();

app.Run();
