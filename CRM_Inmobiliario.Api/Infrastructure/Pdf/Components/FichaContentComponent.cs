using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using CRM_Inmobiliario.Api.Infrastructure.Pdf.Models;
using CRM_Inmobiliario.Api.Infrastructure.Pdf.Theme;

namespace CRM_Inmobiliario.Api.Infrastructure.Pdf.Components;

public class FichaContentComponent : IComponent
{
    private readonly FichaPdfData _data;

    public FichaContentComponent(FichaPdfData data)
    {
        _data = data;
    }

    public void Compose(IContainer container)
    {
        container.Column(col =>
        {
            // Imagen Principal
            if (_data.ImagenPrincipal != null)
            {
                col.Item()
                   .PaddingTop(10)
                   .Height(350)
                   .AlignCenter()
                   .AlignMiddle()
                   .Padding(2)
                   .Border(0.5f)
                   .BorderColor(Colors.Grey.Lighten3)
                   .Image(_data.ImagenPrincipal)
                   .FitArea();
            }

            // Características Grid
            col.Item().PaddingVertical(25).Row(row =>
            {
                row.RelativeItem().Element(c => FeatureBox(c, "Habitaciones", _data.Habitaciones.ToString()));
                row.RelativeItem().Element(c => FeatureBox(c, "Baños", _data.Banos.ToString("G29")));
                row.RelativeItem().Element(c => FeatureBox(c, "Área Total", $"{_data.AreaTotal} m²"));
                row.RelativeItem().Element(c => FeatureBox(c, "Tipo", _data.TipoPropiedad));
                row.RelativeItem().Element(c => FeatureBox(c, "Operación", _data.Operacion));
            });

            // Descripción
            col.Item().PaddingTop(5).Text("DESCRIPCIÓN").FontSize(12).ExtraBold().FontColor(PdfTheme.ColorTextoPrincipal).LetterSpacing(0.05f);
            col.Item().PaddingTop(8).Text(_data.Descripcion).FontSize(10).LineHeight(1.5f).Justify().FontColor(PdfTheme.ColorTextoPrincipal);
        });
    }

    private void FeatureBox(IContainer container, string label, string value)
    {
        container.Column(col =>
        {
            col.Item().AlignCenter().Text(value).FontSize(14).Bold().FontColor(PdfTheme.ColorAzulPrimario);
            col.Item().AlignCenter().PaddingTop(2).Text(label.ToUpper()).FontSize(7).Light().FontColor(PdfTheme.ColorTextoSecundario);
        });
    }
}
