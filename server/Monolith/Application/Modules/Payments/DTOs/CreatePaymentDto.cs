namespace Application.Modules.Payments.DTOs;

public class CreatePaymentDto
{
    public Guid BookingId { get; set; }

    public decimal Amount { get; set; }
}
