using System.Text.RegularExpressions;

namespace CRM_Inmobiliario.Api.Extensions;

public static partial class PhoneExtensions
{
    [GeneratedRegex(@"[^\d]")]
    private static partial Regex DigitsOnlyRegex();

    /// <summary>
    /// Normaliza un número de teléfono para que siempre tenga el prefijo +593 (Ecuador).
    /// </summary>
    /// <param name="phone">El número de entrada.</param>
    /// <returns>El número normalizado en formato +593XXXXXXXXX.</returns>
    public static string? NormalizeEcuadorPhone(this string? phone)
    {
        if (string.IsNullOrWhiteSpace(phone))
            return null;

        // Limpiar todo excepto dígitos
        var digits = DigitsOnlyRegex().Replace(phone, "");

        if (string.IsNullOrEmpty(digits))
            return null;

        // Si ya tiene el código de país 593 al inicio
        if (digits.StartsWith("593"))
        {
            return $"+{digits}";
        }

        // Si empieza con 0 (común en Ecuador, ej. 098...), quitar el 0
        if (digits.StartsWith('0'))
        {
            digits = digits[1..];
        }

        // Si después de limpiar tiene 9 dígitos (celular estándar en Ecuador sin el 0 inicial)
        // o 8 dígitos (fijo), le ponemos el prefijo.
        return $"+593{digits}";
    }
}
