using Application.Modules.Audit.Interfaces;
using Application.Modules.Clients.DTOs;
using Application.Modules.Clients.Interfaces;
using Domain.Clients;
using Microsoft.Extensions.Logging;

namespace Application.Modules.Clients.Services;

public class ClientService : IClientService
{
    private readonly IClientRepository _clientRepository;
    private readonly IAuditService _auditService;
    private readonly ILogger<ClientService> _logger;

    public ClientService(
        IClientRepository clientRepository,
        IAuditService auditService,
        ILogger<ClientService> logger)
    {
        _clientRepository = clientRepository;
        _auditService = auditService;
        _logger = logger;
    }

    public async Task<IReadOnlyList<ClientDto>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var clients = await _clientRepository.GetAllAsync(cancellationToken);
        return clients.Select(MapToDto).ToList();
    }

    public async Task<ClientDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var client = await _clientRepository.GetByIdAsync(id, cancellationToken);
        if (client is null)
        {
            return null;
        }

        return MapToDto(client);
    }

    public async Task<ClientDto> CreateAsync(ClientDto dto, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = NormalizeEmail(dto.Email);
        var normalizedPassportNumber = NormalizePassportNumber(dto.PassportNumber);

        await EnsureUniqueAsync(normalizedEmail, normalizedPassportNumber, null, cancellationToken);

        var client = MapToEntity(dto);
        client.Id = Guid.NewGuid();
        client.Email = normalizedEmail;
        client.PassportNumber = normalizedPassportNumber;

        var created = await _clientRepository.AddAsync(client, cancellationToken);
        _logger.LogInformation("Клиент создан. Id={ClientId}, Email={Email}", created.Id, created.Email);
        await _auditService.WriteAsync(
            action: "Create",
            entityType: "Client",
            entityId: created.Id.ToString(),
            success: true,
            details: $"Создан клиент с email {created.Email}",
            cancellationToken: cancellationToken);
        return MapToDto(created);
    }

    public async Task<ClientDto?> UpdateAsync(Guid id, ClientDto dto, CancellationToken cancellationToken = default)
    {
        var existing = await _clientRepository.GetByIdAsync(id, cancellationToken);
        if (existing is null)
        {
            _logger.LogWarning("Попытка обновить несуществующего клиента. Id={ClientId}", id);
            await _auditService.WriteAsync(
                action: "Update",
                entityType: "Client",
                entityId: id.ToString(),
                success: false,
                details: "Клиент не найден при обновлении",
                cancellationToken: cancellationToken);
            return null;
        }

        var normalizedEmail = NormalizeEmail(dto.Email);
        var normalizedPassportNumber = NormalizePassportNumber(dto.PassportNumber);

        await EnsureUniqueAsync(normalizedEmail, normalizedPassportNumber, id, cancellationToken);

        existing.FullName = dto.FullName;
        existing.PhoneNumber = dto.PhoneNumber;
        existing.PassportNumber = normalizedPassportNumber;
        existing.IsRegular = dto.IsRegular;
        existing.Email = normalizedEmail;

        var updated = await _clientRepository.UpdateAsync(existing, cancellationToken);
        if (updated is null)
        {
            _logger.LogWarning("Не удалось обновить клиента. Id={ClientId}", id);
            await _auditService.WriteAsync(
                action: "Update",
                entityType: "Client",
                entityId: id.ToString(),
                success: false,
                details: "Обновление клиента завершилось без результата",
                cancellationToken: cancellationToken);
            return null;
        }

        _logger.LogInformation("Клиент обновлён. Id={ClientId}, Email={Email}", updated.Id, updated.Email);
        await _auditService.WriteAsync(
            action: "Update",
            entityType: "Client",
            entityId: updated.Id.ToString(),
            success: true,
            details: $"Обновлён клиент с email {updated.Email}",
            cancellationToken: cancellationToken);
        return MapToDto(updated);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var deleted = await _clientRepository.DeleteAsync(id, cancellationToken);
        if (!deleted)
        {
            _logger.LogWarning("Попытка удалить несуществующего клиента. Id={ClientId}", id);
            await _auditService.WriteAsync(
                action: "Delete",
                entityType: "Client",
                entityId: id.ToString(),
                success: false,
                details: "Клиент не найден при удалении",
                cancellationToken: cancellationToken);
            return false;
        }

        _logger.LogInformation("Клиент удалён. Id={ClientId}", id);
        await _auditService.WriteAsync(
            action: "Delete",
            entityType: "Client",
            entityId: id.ToString(),
            success: true,
            details: "Клиент успешно удалён",
            cancellationToken: cancellationToken);
        return true;
    }

    private async Task EnsureUniqueAsync(
        string email,
        string passportNumber,
        Guid? currentClientId,
        CancellationToken cancellationToken)
    {
        var emailExists = await _clientRepository.ExistsByEmailAsync(email, currentClientId, cancellationToken);
        if (emailExists)
        {
            _logger.LogWarning("Отклонено из-за дублирования email. Email={Email}", email);
            await _auditService.WriteAsync(
                action: currentClientId.HasValue ? "Update" : "Create",
                entityType: "Client",
                entityId: currentClientId?.ToString(),
                success: false,
                details: $"Отклонено из-за дублирования email {email}",
                cancellationToken: cancellationToken);
            throw new InvalidOperationException("Client with this email already exists.");
        }

        var passportExists = await _clientRepository.ExistsByPassportNumberAsync(passportNumber, currentClientId, cancellationToken);
        if (passportExists)
        {
            _logger.LogWarning("Отклонено из-за дублирования паспорта. PassportNumber={PassportNumber}", passportNumber);
            await _auditService.WriteAsync(
                action: currentClientId.HasValue ? "Update" : "Create",
                entityType: "Client",
                entityId: currentClientId?.ToString(),
                success: false,
                details: $"Отклонено из-за дублирования паспорта {passportNumber}",
                cancellationToken: cancellationToken);
            throw new InvalidOperationException("Client with this passport number already exists.");
        }
    }

    private static ClientDto MapToDto(Client client)
    {
        return new ClientDto
        {
            Id = client.Id,
            FullName = client.FullName,
            PhoneNumber = client.PhoneNumber,
            PassportNumber = client.PassportNumber,
            IsRegular = client.IsRegular,
            Email = client.Email
        };
    }

    private static Client MapToEntity(ClientDto dto)
    {
        return new Client
        {
            Id = dto.Id,
            FullName = dto.FullName,
            PhoneNumber = dto.PhoneNumber,
            PassportNumber = dto.PassportNumber,
            IsRegular = dto.IsRegular,
            Email = dto.Email
        };
    }

    private static string NormalizeEmail(string email)
    {
        return email.Trim().ToLowerInvariant();
    }

    private static string NormalizePassportNumber(string passportNumber)
    {
        return passportNumber.Trim().ToUpperInvariant();
    }
}
