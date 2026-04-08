using Application.Modules.Auth.Authorization;
using Application.Modules.Payments.DTOs;
using Application.Modules.Payments.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Presentation.Modules.Payments.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = AuthorizationPolicies.StaffOnly)]
public class PaymentsController : ControllerBase
{
    private readonly IPaymentService _paymentService;

    public PaymentsController(IPaymentService paymentService)
    {
        _paymentService = paymentService;
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<PaymentDto>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var payment = await _paymentService.GetByIdAsync(id, cancellationToken);
        if (payment is null)
        {
            return NotFound();
        }

        return Ok(payment);
    }

    [HttpPost]
    public async Task<ActionResult<PaymentDto>> Create([FromBody] CreatePaymentDto dto, CancellationToken cancellationToken)
    {
        var created = await _paymentService.CreateAsync(dto, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPost("{id:guid}/pay")]
    public async Task<ActionResult<PaymentDto>> Pay(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            var payment = await _paymentService.PayAsync(id, cancellationToken);
            if (payment is null)
            {
                return NotFound();
            }

            return Ok(payment);
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }

    [HttpPost("{id:guid}/cancel")]
    public async Task<ActionResult<PaymentDto>> Cancel(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            var payment = await _paymentService.CancelAsync(id, cancellationToken);
            if (payment is null)
            {
                return NotFound();
            }

            return Ok(payment);
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }
}
