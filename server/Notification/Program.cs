using MassTransit;
using Microsoft.Extensions.Hosting;
using Notification.Messages;
using Notification.Consumers;

var builder = Host.CreateApplicationBuilder(args);

builder.Services.AddMassTransit(x =>
{
    // Регистрируем consumer для события бронирования
    x.AddConsumer<BookingCreatedConsumer>();

    x.UsingRabbitMq((context, cfg) =>
    {
        cfg.Host("localhost", "/", h =>
        {
            h.Username("guest");
            h.Password("guest");
        });

        cfg.ReceiveEndpoint("notification-booking-created", e =>
        {
            e.ConfigureConsumer<BookingCreatedConsumer>(context);
        });
    });
});

var host = builder.Build();
await host.RunAsync();
