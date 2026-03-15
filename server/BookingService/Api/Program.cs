using BookingService.Api.Messaging;
using BookingService.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("BookingDb")
                     ?? "Host=localhost;Port=5432;Database=bookingdb;Username=postgres;Password=postgres";

builder.Services.AddDbContext<BookingDbContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services.AddHostedService<BookingConsumer>();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapGet("/", () => "Booking Service API");

app.Run();

