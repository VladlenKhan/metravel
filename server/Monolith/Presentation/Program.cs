using Application.Modules.Audit.Interfaces;
using Application.Modules.Audit.Services;
using Application.Modules.Tours.Interfaces;
using Application.Modules.Tours.Services;
using Infrastructure;
using Infrastructure.Modules.Audit.Repositories;
using Infrastructure.Modules.Tours.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using Presentation.Middleware;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("Default");

builder.Services.AddDbContext<MeTravelDbContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services.AddScoped<ITourRepository, TourRepository>();
builder.Services.AddScoped<ITourService, TourService>();
builder.Services.AddScoped<IAuditRepository, AuditRepository>();
builder.Services.AddScoped<IAuditService, AuditService>();

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
});

var app = builder.Build();

// Глобальная обработка необработанных исключений
app.UseMiddleware<GlobalExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapControllers();

app.Run();

