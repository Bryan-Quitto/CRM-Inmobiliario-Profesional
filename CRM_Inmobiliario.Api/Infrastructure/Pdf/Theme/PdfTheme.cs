using QuestPDF.Helpers;

namespace CRM_Inmobiliario.Api.Infrastructure.Pdf.Theme;

public static class PdfTheme
{
    public const string ColorAzulPrimario = "#1E3A8A";
    public const string ColorTextoPrincipal = "#0F172A";
    public const string ColorTextoSecundario = "#64748B";
    public const string ColorFooterFondo = "#0F172A";
    
    public static string ColorBackground => Colors.Blue.Lighten5;
    public static string ColorLineRed => Colors.Red.Medium;
}
