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
    public record AgencyResponse(Guid Id, string Nombre, DateTimeOffset FechaCreacion, string? TelefonoCorporativo, string? EmailCorporativo, string? DireccionFisica, string? SitioWeb, string? ContextoCorporativoIA);
    public record CreateAgencyRequest(string Nombre, string? TelefonoCorporativo, string? EmailCorporativo, string? DireccionFisica, string? SitioWeb, string? ContextoCorporativoIA);
    public record UpdateAgencyRequest(string Nombre, string? TelefonoCorporativo, string? EmailCorporativo, string? DireccionFisica, string? SitioWeb, string? ContextoCorporativoIA);

    public static void MapAgenciasEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/configuracion/agencias").WithTags("Agencias");

        // Listar Agencias (Público para los agentes que invitan o ven su perfil)
        group.MapGet("/", async (CrmDbContext context) =>
        {
            var agencias = await context.Agencies
                .AsNoTracking()
                .OrderBy(a => a.Nombre)
                .Select(a => new AgencyResponse(a.Id, a.Nombre, a.FechaCreacion, a.TelefonoCorporativo, a.EmailCorporativo, a.DireccionFisica, a.SitioWeb, a.ContextoCorporativoIA))
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
                .Select(a => new AgencyResponse(a.Id, a.Nombre, a.FechaCreacion, a.TelefonoCorporativo, a.EmailCorporativo, a.DireccionFisica, a.SitioWeb, a.ContextoCorporativoIA))
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
                FechaCreacion = DateTimeOffset.UtcNow,
                TelefonoCorporativo = request.TelefonoCorporativo,
                EmailCorporativo = request.EmailCorporativo,
                DireccionFisica = request.DireccionFisica,
                SitioWeb = request.SitioWeb,
                ContextoCorporativoIA = request.ContextoCorporativoIA
            };

            context.Agencies.Add(agencia);
            await context.SaveChangesAsync();

            return Results.Created($"/api/configuracion/agencias/{agencia.Id}", new AgencyResponse(agencia.Id, agencia.Nombre, agencia.FechaCreacion, agencia.TelefonoCorporativo, agencia.EmailCorporativo, agencia.DireccionFisica, agencia.SitioWeb, agencia.ContextoCorporativoIA));
        })
        .WithName("CrearAgencia")
        .RequireAuthorization("AdminPolicy");

        // Actualizar Agencia (Solo Administrador)
        group.MapPut("/{id:guid}", async (Guid id, UpdateAgencyRequest request, CrmDbContext context) =>
        {
            if (string.IsNullOrWhiteSpace(request.Nombre))
                return Results.BadRequest("El nombre de la agencia es requerido.");

            var agencia = await context.Agencies.FindAsync(id);
            if (agencia is null)
                return Results.NotFound();

            var existe = await context.Agencies.AnyAsync(a => a.Id != id && a.Nombre.ToLower() == request.Nombre.ToLower());
            if (existe)
                return Results.Conflict("Ya existe otra agencia con ese nombre.");

            agencia.Nombre = request.Nombre;
            agencia.TelefonoCorporativo = request.TelefonoCorporativo;
            agencia.EmailCorporativo = request.EmailCorporativo;
            agencia.DireccionFisica = request.DireccionFisica;
            agencia.SitioWeb = request.SitioWeb;
            agencia.ContextoCorporativoIA = request.ContextoCorporativoIA;

            await context.SaveChangesAsync();

            return Results.Ok(new AgencyResponse(agencia.Id, agencia.Nombre, agencia.FechaCreacion, agencia.TelefonoCorporativo, agencia.EmailCorporativo, agencia.DireccionFisica, agencia.SitioWeb, agencia.ContextoCorporativoIA));
        })
        .WithName("ActualizarAgencia")
        .RequireAuthorization("AdminPolicy");
    }
}
