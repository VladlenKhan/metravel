using BookingService.Api.Messaging;
using BookingService.Application.Interfaces;
using BookingService.Application.Services;
using BookingService.Infrastructure.Data;
using BookingService.Infrastructure.Repositories;
using MassTransit;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("BookingDb")
                     ?? "Host=localhost;Port=5432;Database=bookingdb;Username=postgres;Password=postgres";
var rabbitMqHost = builder.Configuration["RabbitMq:Host"] ?? "localhost";
var rabbitMqPort = ushort.TryParse(builder.Configuration["RabbitMq:Port"], out var rabbitMqPortValue) ? rabbitMqPortValue : (ushort)5672;
var rabbitMqVirtualHost = builder.Configuration["RabbitMq:VirtualHost"] ?? "/";
var rabbitMqUsername = builder.Configuration["RabbitMq:Username"] ?? "guest";
var rabbitMqPassword = builder.Configuration["RabbitMq:Password"] ?? "guest";

builder.Services.AddDbContext<BookingDbContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services.AddScoped<IBookingRepository, BookingRepository>();
builder.Services.AddScoped<IBookingService, BookingApplicationService>();

builder.Services.AddMassTransit(x =>
{
    x.AddConsumer<BookingRequestedConsumer>();
    x.AddConsumer<BookingStatusChangedConsumer>();

    x.UsingRabbitMq((context, cfg) =>
    {
        cfg.Host(rabbitMqHost, rabbitMqPort, rabbitMqVirtualHost, h =>
        {
            h.Username(rabbitMqUsername);
            h.Password(rabbitMqPassword);
        });

        cfg.ReceiveEndpoint("booking.requests", e =>
        {
            e.ConfigureConsumer<BookingRequestedConsumer>(context);
        });

        cfg.ReceiveEndpoint("booking.status-changed", e =>
        {
            e.ConfigureConsumer<BookingStatusChangedConsumer>(context);
        });
    });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<BookingDbContext>();
    await dbContext.Database.EnsureCreatedAsync();
}

app.MapGet("/", () => "Booking Service API");

app.Run();
