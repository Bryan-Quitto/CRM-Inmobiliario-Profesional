using System.Text;

namespace CRM_Inmobiliario.Api.Features.Propiedades;

/// <summary>
/// Transforma una colección de FAQs aprobadas en una sección de texto
/// lista para ser inyectada en el contexto del LLM.
/// </summary>
public static class PropertyFaqContextEnricher
{
    public static string BuildSection(IEnumerable<(string Pregunta, string Respuesta)> faqs)
    {
        var list = faqs.ToList();
        if (list.Count == 0)
            return string.Empty;

        var sb = new StringBuilder();
        sb.AppendLine("--- PREGUNTAS FRECUENTES ---");

        foreach (var (pregunta, respuesta) in list)
        {
            sb.AppendLine($"P: {pregunta}");
            sb.AppendLine($"R: {respuesta}");
            sb.AppendLine();
        }

        sb.AppendLine("---");
        return sb.ToString();
    }
}
