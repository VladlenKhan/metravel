FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY ["Contracts/MeTravel.Contracts.csproj", "Contracts/"]
COPY ["Monolith/Application/Application.csproj", "Monolith/Application/"]
COPY ["Monolith/Domain/Domain.csproj", "Monolith/Domain/"]
COPY ["Monolith/Infrastructure/Infrastructure.csproj", "Monolith/Infrastructure/"]
COPY ["Monolith/Presentation/Presentation.csproj", "Monolith/Presentation/"]

RUN dotnet restore "Monolith/Presentation/Presentation.csproj"

COPY . .
WORKDIR /src/Monolith/Presentation
RUN dotnet publish "Presentation.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app

COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "Presentation.dll"]
