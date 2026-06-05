using System.Text.RegularExpressions;
using PhoneNumbers;

namespace CRM_Inmobiliario.Api.Extensions;

public static partial class PhoneExtensions
{
    [GeneratedRegex(@"[^\d+]")]
    private static partial Regex DigitsAndPlusRegex();

    /// <summary>
    /// Normaliza un número de teléfono a E.164.
    /// Si no tiene código de país, asume +593 (Ecuador).
    /// </summary>
    /// <param name="phone">El número de entrada.</param>
    /// <returns>El número normalizado en formato E.164.</returns>
    public static string? NormalizePhoneE164(this string? phone)
    {
        if (string.IsNullOrWhiteSpace(phone))
            return null;

        var util = PhoneNumberUtil.GetInstance();
        try
        {
            // Asume Ecuador si no se especifica el código de país.
            var parsedNumber = util.Parse(phone, "EC");
            return util.Format(parsedNumber, PhoneNumberFormat.E164);
        }
        catch (NumberParseException)
        {
            // Fallback básico si falla libphonenumber
            var cleanPhone = DigitsAndPlusRegex().Replace(phone, "");
            
            if (string.IsNullOrWhiteSpace(cleanPhone))
                return null;

            if (!cleanPhone.StartsWith('+'))
            {
                if (cleanPhone.StartsWith("593"))
                {
                    cleanPhone = "+" + cleanPhone;
                }
                else
                {
                    if (cleanPhone.StartsWith('0'))
                    {
                        cleanPhone = cleanPhone[1..];
                    }
                    cleanPhone = "+593" + cleanPhone;
                }
            }

            return cleanPhone;
        }
    }
}
