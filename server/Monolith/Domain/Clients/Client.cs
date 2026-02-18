using Domain.Bookings;

namespace Domain.Clients;

public class Client
{
    public Guid Id { get; set; }

    public string FullName { get; set; } = null!;

    public string PhoneNumber { get; set; } = null!;

    public string PassportNumber { get; set; } = null!;

    public bool IsRegular { get; set; }

    public string Email { get; set; } = null!;

    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
}
