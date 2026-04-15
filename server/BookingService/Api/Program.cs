using BookingService.Api.Messaging;
using BookingService.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity; // Добавлено

var builder = WebApplication.CreateBuilder(args);

// 1. Настройка базы данных
var connectionString = builder.Configuration.GetConnectionString("BookingDb")
                     ?? "Host=localhost;Port=5432;Database=bookingdb;Username=postgres;Password=postgres";

builder.Services.AddDbContext<BookingDbContext>(options =>
    options.UseNpgsql(connectionString));

// 2. РЕГИСТРАЦИЯ IDENTITY И РОЛЕЙ (Новое!)
// Здесь мы говорим системе использовать IdentityRole
builder.Services.AddIdentity<IdentityUser, IdentityRole>(options => {
    options.Password.RequireDigit = false;
    options.Password.RequiredLength = 6;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = false;
})
.AddEntityFrameworkStores<BookingDbContext>() // Используем твой контекст
.AddDefaultTokenProviders();

// 3. Фоновые службы и контроллеры
builder.Services.AddHostedService<BookingConsumer>();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// 4. Настройка Middleware
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// ВАЖНО: Порядок имеет значение! 
// Authentication должен быть ПЕРЕД Authorization
app.UseAuthentication(); 
app.UseAuthorization();

app.MapGet("/", () => "Booking Service API");
app.MapControllers();

// 5. СИДИНГ (СОЗДАНИЕ РОЛЕЙ) ПРИ ЗАПУСКЕ (Новое!)
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();
        var userManager = services.GetRequiredService<UserManager<IdentityUser>>();

        // Создаем роли, если их нет
        string[] roleNames = { "Admin", "Manager", "User" };
        foreach (var roleName in roleNames)
        {
            if (!await roleManager.RoleExistsAsync(roleName))
            {
                await roleManager.CreateAsync(new IdentityRole(roleName));
            }
        }

        // Создаем дефолтного админа (для тестов)
        var adminEmail = "admin@metravel.com";
        var adminUser = await userManager.FindByEmailAsync(adminEmail);
        
        if (adminUser == null)
        {
            var newAdmin = new IdentityUser { UserName = adminEmail, Email = adminEmail };
            var result = await userManager.CreateAsync(newAdmin, "Admin123!");
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(newAdmin, "Admin");
            }
        }
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Ошибка при инициализации ролей");
    }
}

app.Run();