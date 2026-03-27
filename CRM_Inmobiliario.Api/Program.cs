var builder = WebApplication.CreateBuilder(args);

// Configuración de servicios base
builder.Services.AddOpenApi();
builder.Services.AddEndpointsApiExplorer();

var app = builder.Build();

// Pipeline de middleware
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

// Registro de Features (Vertical Slice)
// Los endpoints se mapearán dinámicamente o mediante extensiones en /Features

app.Run();
