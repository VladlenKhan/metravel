using Domain.Payments;

namespace Application.Modules.Payments.DTOs;

public class PaymentDto
{
    public Guid Id { get; set; }

    public Guid BookingId { get; set; }

    public decimal Amount { get; set; }

    public PaymentStatus Status { get; set; }
}
