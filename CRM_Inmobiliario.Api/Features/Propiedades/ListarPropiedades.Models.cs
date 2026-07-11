namespace CRM_Inmobiliario.Api.Features.Propiedades;

public record GetPropiedadesRequest(
    int? PageNumber,
    int? PageSize,
    Guid? CheckContactoId,
    string? SearchQuery,
    string? EstadoComercial,
    string? TipoPropiedad,
    string? Operacion,
    decimal? PrecioMin,
    decimal? PrecioMax,
    decimal? AreaTotalMin,
    decimal? AreaTotalMax,
    int? HabitacionesMin,
    int? HabitacionesMax,
    int? AniosAntiguedadMin,
    int? AniosAntiguedadMax,
    bool? EsCaptacionPropia,
    string? SortBy,
    string? SortDirection,
    bool IsArchived = false
);

public record Response(
    Guid Id,
    string? CodigoCorto,
    string Titulo,
    string TipoPropiedad,
    string Operacion,
    decimal Precio,
    string Sector,
    string Ciudad,
    string EstadoComercial,
    bool EsCaptacionPropia,
    decimal PorcentajeComision,
    string AgenteNombre,
    Guid GestorId,
    string GestorNombre,
    Guid? PropietarioId,
    string? PropietarioEstado,
    Guid? CerradoConId,
    string? CerradoConNombre,
    string? ImagenPortadaUrl,
    DateTimeOffset FechaIngreso,
    PropertyPermissions Permissions,
    ActiveTransactionInfo? ActiveTransaction,
    string Version,
    int Habitaciones,
    decimal AreaTotal,
    int? AniosAntiguedad,
    bool AlreadyHasContact = false,
    bool IsArchivedForCurrentUser = false,
    DateTimeOffset? FechaProgramadaLimpiezaR2 = null);

public record PropertyPermissions(
    bool CanEditMasterData,
    bool CanChangeStatus);

public record ActiveTransactionInfo(
    Guid AgenteId,
    string AgenteNombre);
