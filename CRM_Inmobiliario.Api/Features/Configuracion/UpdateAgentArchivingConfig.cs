using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;
using FluentValidation;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;

namespace CRM_Inmobiliario.Api.Features.Configuracion;

public static class UpdateAgentArchivingConfig
{
    public static void MapUpdateAgentArchivingConfigEndpoint(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPut("/agents/archiving-config", async (
            [FromBody] UpdateAgentArchivingConfigRequest request,
            ClaimsPrincipal user,
            CrmDbContext dbContext) =>
        {
            var userIdString = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdString, out Guid currentUserId)) return Results.Unauthorized();

            // Using ExecuteUpdateAsync for backend optimization! No need to fetch object just to update simple fields!
            // Wait, we need to validate first
            var validator = new UpdateAgentArchivingConfigValidator();
            var validationResult = await validator.ValidateAsync(request);
            if (!validationResult.IsValid)
            {
                return Results.BadRequest(validationResult.ToDictionary());
            }

            var rowsAffected = await dbContext.Agents
                .Where(a => a.Id == currentUserId)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(p => p.AutoArchivarContactos, request.AutoArchivarContactos)
                    .SetProperty(p => p.DiasInactividadContactos, request.DiasInactividadContactos)
                    .SetProperty(p => p.AutoArchivarPropiedades, request.AutoArchivarPropiedades)
                    .SetProperty(p => p.DiasInactividadPropiedades, request.DiasInactividadPropiedades)
                );

            if (rowsAffected == 0) return Results.NotFound(new { error = "Agent not found" });

            return Results.Ok(new
            {
                request.AutoArchivarContactos,
                request.DiasInactividadContactos,
                request.AutoArchivarPropiedades,
                request.DiasInactividadPropiedades
            });
        })
        .WithName("UpdateAgentArchivingConfig")
        .WithTags("Configuracion")
        .RequireAuthorization();
    }
}

public class UpdateAgentArchivingConfigRequest
{
    public bool AutoArchivarContactos { get; set; }
    public int DiasInactividadContactos { get; set; }
    public bool AutoArchivarPropiedades { get; set; }
    public int DiasInactividadPropiedades { get; set; }
}

public class UpdateAgentArchivingConfigValidator : AbstractValidator<UpdateAgentArchivingConfigRequest>
{
    public UpdateAgentArchivingConfigValidator()
    {
        RuleFor(x => x.DiasInactividadContactos)
            .InclusiveBetween(100, 1095)
            .WithMessage("Los días de inactividad para contactos deben estar entre 100 y 1095.");

        RuleFor(x => x.DiasInactividadPropiedades)
            .InclusiveBetween(100, 1095)
            .WithMessage("Los días de inactividad para propiedades deben estar entre 100 y 1095.");
    }
}
