using System.Text;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;

namespace BookingService.Api.Messaging;

public class BookingConsumer : BackgroundService
{
    private readonly ILogger<BookingConsumer> _logger;
    private IConnection? _connection;
    private IModel? _channel;

    public BookingConsumer(ILogger<BookingConsumer> logger)
    {
        _logger = logger;
    }

    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var factory = new ConnectionFactory
        {
            HostName = "localhost", // TODO: вынести в конфиг
            UserName = "guest",
            Password = "guest"
        };

        _connection = factory.CreateConnection();
        _channel = _connection.CreateModel();

        _channel.QueueDeclare(
            queue: "booking.requests",
            durable: true,
            exclusive: false,
            autoDelete: false,
            arguments: null);

        var consumer = new EventingBasicConsumer(_channel);
        consumer.Received += (_, ea) =>
        {
            var body = ea.Body.ToArray();
            var message = Encoding.UTF8.GetString(body);
            _logger.LogInformation("Получено сообщение о бронировании: {Message}", message);

            _channel.BasicAck(ea.DeliveryTag, multiple: false);
        };

        _channel.BasicConsume(
            queue: "booking.requests",
            autoAck: false,
            consumer: consumer);

        return Task.CompletedTask;
    }

    public override void Dispose()
    {
        _channel?.Close();
        _connection?.Close();
        base.Dispose();
    }
}
