using System;

namespace CRM_Inmobiliario.Api.Exceptions;

public class StorageQuotaExceededException : Exception
{
    public StorageQuotaExceededException(string message) : base(message)
    {
    }
}
