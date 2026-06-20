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

public static class UpdateAgencyArchivingConfig
{
    public static void MapUpdateAgencyArchivingConfigEndpoint(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPut("/agencies/{id}/archiving-config", async (
            Guid id,
            [FromBody] UpdateAgencyArchivingConfigRequest request,
            ClaimsPrincipal user,
            CrmDbContext dbContext) =>
        {
            var userIdString = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdString, out Guid currentUserId)) return Results.Unauthorized();

            var role = user.FindFirst(ClaimTypes.Role)?.Value ?? user.FindFirst("Rol")?.Value;
            if (role != "Admin") return Results.Forbid();

            var agency = await dbContext.Agencies.FindAsync(id);
            if (agency == null) return Results.NotFound(new { error = "Agency not found" });

            var validator = new UpdateAgencyArchivingConfigValidator();
            var validationResult = await validator.ValidateAsync(request);
            if (!validationResult.IsValid)
            {
                return Results.BadRequest(validationResult.ToDictionary());
            }

            agency.AutoArchivarContactos = request.AutoArchivarContactos;
            agency.DiasInactividadContactos = request.DiasInactividadContactos;
            agency.AutoArchivarPropiedades = request.AutoArchivarPropiedades;
            agency.DiasInactividadPropiedades = request.DiasInactividadPropiedades;

            await dbContext.SaveChangesAsync();

            return Results.Ok(new
            {
                agency.AutoArchivarContactos,
                agency.DiasInactividadContactos,
                agency.AutoArchivarPropiedades,
                agency.DiasInactividadPropiedades
            });
        })
        .WithName("UpdateAgencyArchivingConfig")
        .WithTags("Configuracion")
        .RequireAuthorization();
    }
}

public class UpdateAgencyArchivingConfigRequest
{
    public bool AutoArchivarContactos { get; set; }
    public int DiasInactividadContactos { get; set; }
    public bool AutoArchivarPropiedades { get; set; }
    public int DiasInactividadPropiedades { get; set; }
}

public class UpdateAgencyArchivingConfigValidator : AbstractValidator<UpdateAgencyArchivingConfigRequest>
{
    public UpdateAgencyArchivingConfigValidator()
    {
        RuleFor(x => x.DiasInactividadContactos)
            .InclusiveBetween(100, 1095)
            .WithMessage("Los días de inactividad para contactos deben estar entre 100 y 1095.");

        RuleFor(x => x.DiasInactividadPropiedades)
            .InclusiveBetween(100, 1095)
            .WithMessage("Los días de inactividad para propiedades deben estar entre 100 y 1095.");
    }
}
