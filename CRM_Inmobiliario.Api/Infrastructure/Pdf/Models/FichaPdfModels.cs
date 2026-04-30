namespace CRM_Inmobiliario.Api.Infrastructure.Pdf.Models;

public record FichaPdfData(
    string Titulo,
    string Descripcion,
    string TipoPropiedad,
    string Operacion,
    decimal Precio,
    string UbicacionCompleta,
    int Habitaciones,
    decimal Banos,
    decimal AreaTotal,
    byte[]? ImagenPrincipal,
    string AgenteNombre,
    string AgenteContacto,
    string? AgenciaNombre,
    byte[]? AgenteLogo,
    List<FichaSeccionData> Secciones);

public record FichaSeccionData(
    string Nombre,
    string? Descripcion,
    List<FichaImagenData> Imagenes);

public record FichaImagenData(
    byte[] Content,
    string? Descripcion);
