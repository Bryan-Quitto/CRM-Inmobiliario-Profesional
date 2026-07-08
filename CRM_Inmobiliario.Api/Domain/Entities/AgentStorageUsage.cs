using System;
using System.ComponentModel.DataAnnotations;

namespace CRM_Inmobiliario.Api.Domain.Entities;

public class AgentStorageUsage
{
    public Guid Id { get; set; }

    public Guid AgentId { get; set; }
    public Agent? Agent { get; set; }

    public int Year { get; set; }
    public int Month { get; set; }

    public int UploadOpsCount { get; set; }
    public long TotalBytesUploaded { get; set; }
}
