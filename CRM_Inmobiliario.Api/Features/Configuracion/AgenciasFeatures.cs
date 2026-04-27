using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;

namespace CRM_Inmobiliario.Api.Features.Configuracion;

public static class AgenciasFeatures
{
    public record AgencyResponse(Guid Id, string Nombre, DateTimeOffset FechaCreacion);
    public record CreateAgencyRequest(string Nombre);

    public static void MapAgenciasEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/configuracion/agencias").WithTags("Agencias");

        // Listar Agencias (Público para los agentes que invitan o ven su perfil)
        group.MapGet("/", async (CrmDbContext context) =>
        {
            var agencias = await context.Agencies
                .AsNoTracking()
                .OrderBy(a => a.Nombre)
                .Select(a => new AgencyResponse(a.Id, a.Nombre, a.FechaCreacion))
                .ToListAsync();

            return Results.Ok(agencias);
        })
        .WithName("ListarAgencias");

        // Obtener Agencia por ID
        group.MapGet("/{id:guid}", async (Guid id, CrmDbContext context) =>
        {
            var agencia = await context.Agencies
                .AsNoTracking()
                .Where(a => a.Id == id)
                .Select(a => new AgencyResponse(a.Id, a.Nombre, a.FechaCreacion))
                .FirstOrDefaultAsync();

            return agencia is not null ? Results.Ok(agencia) : Results.NotFound();
        })
        .WithName("ObtenerAgenciaPorId");

        // Crear Agencia (Solo Super Admin)
        group.MapPost("/", async (CreateAgencyRequest request, CrmDbContext context) =>
        {
            if (string.IsNullOrWhiteSpace(request.Nombre))
                return Results.BadRequest("El nombre de la agencia es requerido.");

            var existe = await context.Agencies.AnyAsync(a => a.Nombre.ToLower() == request.Nombre.ToLower());
            if (existe)
                return Results.Conflict("Ya existe una agencia con ese nombre.");

            var agencia = new Agency
            {
                Id = Guid.NewGuid(),
                Nombre = request.Nombre,
                FechaCreacion = DateTimeOffset.UtcNow
            };

            context.Agencies.Add(agencia);
            await context.SaveChangesAsync();

            return Results.Created($"/api/configuracion/agencias/{agencia.Id}", new AgencyResponse(agencia.Id, agencia.Nombre, agencia.FechaCreacion));
        })
        .WithName("CrearAgencia");
    }
}
