using System.Security.Claims;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using ClosedXML.Excel;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Portabilidad.ExportarDatos;

public static class ExportarDatosEndpoint
{
    public static RouteHandlerBuilder MapExportarDatosEndpoint(this IEndpointRouteBuilder app)
    {
        return app.MapGet("/portabilidad/exportar", async (
            string entidad, 
            ClaimsPrincipal user, 
            CrmDbContext context, 
            CancellationToken cancellationToken) =>
        {
            var agenteIdClaim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(agenteIdClaim) || !Guid.TryParse(agenteIdClaim, out var agenteId))
            {
                return Results.Unauthorized();
            }

            using var workbook = new XLWorkbook();

            if (entidad.Equals("contactos", StringComparison.OrdinalIgnoreCase))
            {
                var contactos = await context.Contactos
                    .Where(c => c.AgenteId == agenteId)
                    .Select(c => new
                    {
                        c.Nombre,
                        c.Apellido,
                        c.Email,
                        c.Telefono,
                        c.Origen,
                        c.EstadoEmbudo,
                        c.EstadoPropietario,
                        Tipo = c.EsPropietario && c.EsProspecto ? "Ambos" : (c.EsPropietario ? "Propietario" : "Cliente"),
                        FechaCreacion = c.FechaCreacion.ToString("yyyy-MM-dd HH:mm")
                    })
                    .AsNoTracking()
                    .ToListAsync(cancellationToken);

                var worksheet = workbook.Worksheets.Add("Contactos");
                
                // Headers
                worksheet.Cell(1, 1).Value = "Nombre";
                worksheet.Cell(1, 2).Value = "Apellido";
                worksheet.Cell(1, 3).Value = "Email";
                worksheet.Cell(1, 4).Value = "Teléfono";
                worksheet.Cell(1, 5).Value = "Origen";
                worksheet.Cell(1, 6).Value = "Estado Comercial";
                worksheet.Cell(1, 7).Value = "Estado Propietario";
                worksheet.Cell(1, 8).Value = "Tipo";
                worksheet.Cell(1, 9).Value = "Fecha Creación";

                var headerRow = worksheet.Row(1);
                headerRow.Style.Font.Bold = true;
                headerRow.Style.Fill.BackgroundColor = XLColor.LightGray;

                // Data
                for (int i = 0; i < contactos.Count; i++)
                {
                    var row = i + 2;
                    worksheet.Cell(row, 1).Value = contactos[i].Nombre;
                    worksheet.Cell(row, 2).Value = contactos[i].Apellido;
                    worksheet.Cell(row, 3).Value = contactos[i].Email;
                    worksheet.Cell(row, 4).Value = contactos[i].Telefono;
                    worksheet.Cell(row, 5).Value = contactos[i].Origen;
                    worksheet.Cell(row, 6).Value = contactos[i].EstadoEmbudo;
                    worksheet.Cell(row, 7).Value = contactos[i].EstadoPropietario;
                    worksheet.Cell(row, 8).Value = contactos[i].Tipo;
                    worksheet.Cell(row, 9).Value = contactos[i].FechaCreacion;
                }
                
                worksheet.Columns().AdjustToContents();
            }
            else if (entidad.Equals("propiedades", StringComparison.OrdinalIgnoreCase))
            {
                var propiedades = await context.Properties
                    .Where(p => p.AgenteId == agenteId)
                    .Select(p => new
                    {
                        p.Titulo,
                        p.CodigoCorto,
                        p.TipoPropiedad,
                        p.Operacion,
                        p.Precio,
                        p.Direccion,
                        p.Sector,
                        p.Ciudad,
                        p.EstadoComercial,
                        FechaIngreso = p.FechaIngreso.ToString("yyyy-MM-dd HH:mm")
                    })
                    .AsNoTracking()
                    .ToListAsync(cancellationToken);

                var worksheet = workbook.Worksheets.Add("Propiedades");
                
                // Headers
                worksheet.Cell(1, 1).Value = "Código";
                worksheet.Cell(1, 2).Value = "Título";
                worksheet.Cell(1, 3).Value = "Tipo";
                worksheet.Cell(1, 4).Value = "Operación";
                worksheet.Cell(1, 5).Value = "Precio";
                worksheet.Cell(1, 6).Value = "Estado Comercial";
                worksheet.Cell(1, 7).Value = "Ciudad";
                worksheet.Cell(1, 8).Value = "Sector";
                worksheet.Cell(1, 9).Value = "Dirección";
                worksheet.Cell(1, 10).Value = "Fecha Ingreso";

                var headerRow = worksheet.Row(1);
                headerRow.Style.Font.Bold = true;
                headerRow.Style.Fill.BackgroundColor = XLColor.LightGray;

                // Data
                for (int i = 0; i < propiedades.Count; i++)
                {
                    var row = i + 2;
                    worksheet.Cell(row, 1).Value = propiedades[i].CodigoCorto;
                    worksheet.Cell(row, 2).Value = propiedades[i].Titulo;
                    worksheet.Cell(row, 3).Value = propiedades[i].TipoPropiedad;
                    worksheet.Cell(row, 4).Value = propiedades[i].Operacion;
                    worksheet.Cell(row, 5).Value = propiedades[i].Precio;
                    worksheet.Cell(row, 6).Value = propiedades[i].EstadoComercial;
                    worksheet.Cell(row, 7).Value = propiedades[i].Ciudad;
                    worksheet.Cell(row, 8).Value = propiedades[i].Sector;
                    worksheet.Cell(row, 9).Value = propiedades[i].Direccion;
                    worksheet.Cell(row, 10).Value = propiedades[i].FechaIngreso;
                }
                
                worksheet.Columns().AdjustToContents();
            }
            else
            {
                return Results.BadRequest("Entidad no soportada. Usa 'contactos' o 'propiedades'.");
            }

            using var memoryStream = new MemoryStream();
            workbook.SaveAs(memoryStream);
            memoryStream.Position = 0;

            var fileName = $"Exportacion_{entidad}_{DateTime.Now:yyyyMMdd_HHmm}.xlsx";
            
            return Results.File(memoryStream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
        })
        .RequireAuthorization()
        .WithName("ExportarDatos")
        .WithTags("Portabilidad");
    }
}
