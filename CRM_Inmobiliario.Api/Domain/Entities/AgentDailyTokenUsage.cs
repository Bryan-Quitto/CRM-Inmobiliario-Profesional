using System;

namespace CRM_Inmobiliario.Api.Domain.Entities;

public class AgentDailyTokenUsage
{
    public Guid Id { get; set; }
    public Guid AgentId { get; set; }
    public DateTimeOffset Date { get; set; }
    public int TokensUsed { get; set; }
    public int InputTokens { get; set; }
    public int CachedTokens { get; set; }
    public int OutputTokens { get; set; }
    public decimal CostoUSD { get; set; }
    public decimal AhorroUSD { get; set; }
    public string Channel { get; set; } = "Copilot";

    public Agent Agent { get; set; } = null!;
}
