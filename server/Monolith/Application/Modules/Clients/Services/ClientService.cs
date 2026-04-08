using Application.Modules.Clients.DTOs;
using Application.Modules.Clients.Interfaces;
using Domain.Clients;

namespace Application.Modules.Clients.Services;

public class ClientService : IClientService
{
    private readonly IClientRepository _clientRepository;

    public ClientService(IClientRepository clientRepository)
    {
        _clientRepository = clientRepository;
    }

    public async Task<IReadOnlyList<ClientDto>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var clients = await _clientRepository.GetAllAsync(cancellationToken);
        return clients.Select(MapToDto).ToList();
    }

    public async Task<ClientDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var client = await _clientRepository.GetByIdAsync(id, cancellationToken);
        return client is null ? null : MapToDto(client);
    }

    public async Task<ClientDto> CreateAsync(ClientDto dto, CancellationToken cancellationToken = default)
    {
        await EnsureUniqueAsync(dto.Email, dto.PassportNumber, null, cancellationToken);

        var client = MapToEntity(dto);
        client.Id = Guid.NewGuid();

        var created = await _clientRepository.AddAsync(client, cancellationToken);
        return MapToDto(created);
    }

    public async Task<ClientDto?> UpdateAsync(Guid id, ClientDto dto, CancellationToken cancellationToken = default)
    {
        var existing = await _clientRepository.GetByIdAsync(id, cancellationToken);
        if (existing is null)
        {
            return null;
        }

        await EnsureUniqueAsync(dto.Email, dto.PassportNumber, id, cancellationToken);

        existing.FullName = dto.FullName;
        existing.PhoneNumber = dto.PhoneNumber;
        existing.PassportNumber = dto.PassportNumber;
        existing.IsRegular = dto.IsRegular;
        existing.Email = dto.Email;
        existing.PasswordHash = dto.PasswordHash;
        existing.Role = dto.Role;

        var updated = await _clientRepository.UpdateAsync(existing, cancellationToken);
        return updated is null ? null : MapToDto(updated);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _clientRepository.DeleteAsync(id, cancellationToken);
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
            throw new InvalidOperationException("Client with this email already exists.");
        }

        var passportExists = await _clientRepository.ExistsByPassportNumberAsync(passportNumber, currentClientId, cancellationToken);
        if (passportExists)
        {
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
            Email = client.Email,
            PasswordHash = client.PasswordHash,
            Role = client.Role
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
            Email = dto.Email,
            PasswordHash = dto.PasswordHash,
            Role = dto.Role
        };
    }
}
