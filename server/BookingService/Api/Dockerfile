FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY ["Contracts/MeTravel.Contracts.csproj", "Contracts/"]
COPY ["BookingService/Domain/BookingService.Domain.csproj", "BookingService/Domain/"]
COPY ["BookingService/Application/BookingService.Application.csproj", "BookingService/Application/"]
COPY ["BookingService/Infrastructure/BookingService.Infrastructure.csproj", "BookingService/Infrastructure/"]
COPY ["BookingService/Api/BookingService.Api.csproj", "BookingService/Api/"]

RUN dotnet restore "BookingService/Api/BookingService.Api.csproj"

COPY . .
WORKDIR /src/BookingService/Api
RUN dotnet publish "BookingService.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app

COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "BookingService.Api.dll"]
