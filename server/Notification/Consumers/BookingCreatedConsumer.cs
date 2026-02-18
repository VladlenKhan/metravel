using MassTransit;
using Notification.Messages;

namespace Notification.Consumers;

public class BookingCreatedConsumer(ILogger<BookingCreatedConsumer> logger) : IConsumer<BookingCreated>
{
    public Task Consume(ConsumeContext<BookingCreated> context)
    {
        var message = context.Message;

        // TODO: здесь будет логика отправки email / push уведомления
        logger.LogInformation(
            "Получено событие BookingCreated: BookingId={BookingId}, ClientId={ClientId}, Email={Email}, TotalPrice={TotalPrice}",
            message.BookingId,
            message.ClientId,
            message.ClientEmail,
            message.TotalPrice);

        return Task.CompletedTask;
    }
}


