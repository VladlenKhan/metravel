namespace Application.Modules.Messaging.Interfaces;

public interface IRabbitMqPublisher
{
    Task PublishAsync(string queueName, string message, CancellationToken cancellationToken = default);
}

