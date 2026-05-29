using System;
using System.Net.Http;

namespace CRM_Inmobiliario.Api.Domain;

public static class Constants
{
    public static readonly HttpRequestOptionsKey<Guid> AgentIdOptionKey = new("ByokAgentId");
}
