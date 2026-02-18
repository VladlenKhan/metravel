namespace Notification.Messages;

// Пример интеграционного события; позже можно вынести в общий Contracts-проект
public record BookingCreated(
    Guid BookingId,
    Guid ClientId,
    Guid TourId,
    DateTime StartDate,
    decimal TotalPrice,
    string ClientEmail
);

