namespace CRM_Inmobiliario.Api.Features.FinOps.GetAgentTokenUsage;

public class TokenUsageDto
{
    public string Fecha { get; set; } = string.Empty;
    public string Modelo { get; set; } = string.Empty;
    public int TokensInput { get; set; }
    public int TokensOutput { get; set; }
    public decimal CostoTotalUsd { get; set; }
}
