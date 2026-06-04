using System;

namespace CRM_Inmobiliario.Api.Domain.Entities;

public class FinancialRate
{
    public Guid Id { get; set; }
    public decimal TasaInteresAnual { get; set; }
    public int[] PlazosDisponibles { get; set; } = Array.Empty<int>();
    public DateTimeOffset UpdatedAt { get; set; }
}
