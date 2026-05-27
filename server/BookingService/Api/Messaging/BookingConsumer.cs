using System.Text.Json;
using BookingService.Application.Interfaces;
using MeTravel.Contracts.Bookings;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;

namespace BookingService.Api.Messaging;

public class BookingConsumer : BackgroundService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private readonly ILogger<BookingConsumer> _logger;
    private readonly IConfiguration _configuration;
    private readonly IServiceScopeFactory _scopeFactory;
    private IConnection? _connection;
    private IModel? _channel;

    public BookingConsumer(
        ILogger<BookingConsumer> logger,
        IConfiguration configuration,
        IServiceScopeFactory scopeFactory)
    {
        _logger = logger;
        _configuration = configuration;
        _scopeFactory = scopeFactory;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var factory = new ConnectionFactory
        {
            HostName = _configuration["RabbitMq:Host"] ?? "localhost",
            Port = int.TryParse(_configuration["RabbitMq:Port"], out var port) ? port : 5672,
            VirtualHost = _configuration["RabbitMq:VirtualHost"] ?? "/",
            UserName = _configuration["RabbitMq:Username"] ?? "guest",
            Password = _configuration["RabbitMq:Password"] ?? "guest",
            DispatchConsumersAsync = true
        };

        _connection = factory.CreateConnection();
        _channel = _connection.CreateModel();

        ConfigureConsumer(
            queueName: "booking.requests",
            handleMessageAsync: message => HandleMessageAsync<BookingRequestedIntegrationEvent>(
                message,
                (bookingService, integrationEvent, cancellationToken) =>
                    bookingService.CreateAsync(integrationEvent, cancellationToken),
                stoppingToken));

        ConfigureConsumer(
            queueName: "booking.status",
            handleMessageAsync: message => HandleMessageAsync<BookingStatusChangedIntegrationEvent>(
                message,
                (bookingService, integrationEvent, cancellationToken) =>
                    bookingService.ChangeStatusAsync(integrationEvent, cancellationToken),
                stoppingToken));

        _logger.LogInformation("Booking consumer started.");

        try
        {
            await Task.Delay(Timeout.Infinite, stoppingToken);
        }
        catch (TaskCanceledException)
        {
            _logger.LogInformation("Booking consumer stopped.");
        }
    }

    public override void Dispose()
    {
        _channel?.Close();
        _connection?.Close();
        base.Dispose();
    }

    private void ConfigureConsumer(string queueName, Func<string, Task> handleMessageAsync)
    {
        _channel!.QueueDeclare(
            queue: queueName,
            durable: true,
            exclusive: false,
            autoDelete: false,
            arguments: null);

        var consumer = new AsyncEventingBasicConsumer(_channel);
        consumer.Received += async (_, ea) =>
        {
            var message = System.Text.Encoding.UTF8.GetString(ea.Body.ToArray());

            try
            {
                await handleMessageAsync(message);
                _channel.BasicAck(ea.DeliveryTag, multiple: false);
            }
            catch (Exception exception)
            {
                _logger.LogError(
                    exception,
                    "Failed to process RabbitMQ message from queue {QueueName}. Payload={Payload}",
                    queueName,
                    message);
                _channel.BasicNack(ea.DeliveryTag, multiple: false, requeue: false);
            }
        };

        _channel.BasicConsume(
            queue: queueName,
            autoAck: false,
            consumer: consumer);
    }

    private async Task HandleMessageAsync<TMessage>(
        string payload,
        Func<IBookingService, TMessage, CancellationToken, Task> action,
        CancellationToken cancellationToken)
    {
        var message = JsonSerializer.Deserialize<TMessage>(payload, JsonOptions);
        if (message is null)
        {
            throw new InvalidOperationException($"Failed to deserialize message of type {typeof(TMessage).Name}.");
        }

        using var scope = _scopeFactory.CreateScope();
        var bookingService = scope.ServiceProvider.GetRequiredService<IBookingService>();
        await action(bookingService, message, cancellationToken);
    }
}
