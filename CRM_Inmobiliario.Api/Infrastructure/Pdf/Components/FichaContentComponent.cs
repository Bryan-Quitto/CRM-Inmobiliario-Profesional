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
            col.Item().PaddingVertical(25).Table(table =>
            {
                var features = new List<(string Label, string Value, string Icon)>();
                
                features.Add(("Tipo", _data.TipoPropiedad, SvgIcons.Home));
                features.Add(("Operación", _data.Operacion, SvgIcons.Tag));
                features.Add(("Área Total", $"{_data.AreaTotal:G29} m²", SvgIcons.Maximize));

                var tipo = _data.TipoPropiedad;
                var showAreaTerreno = tipo == "Casa" || tipo == "Terreno" || tipo == "Galpón" || tipo == "Bodega" || tipo == "Local Comercial" || tipo == "Hotel";
                var showAreaConstruccion = tipo == "Casa" || tipo == "Galpón" || tipo == "Bodega" || tipo == "Hotel";
                var showHabitaciones = tipo == "Casa" || tipo == "Departamento" || tipo == "Suite" || tipo == "Hotel";
                var isNotTerreno = tipo != "Terreno";

                if (showAreaTerreno && _data.AreaTerreno.HasValue)
                    features.Add(("Área Terreno", $"{_data.AreaTerreno.Value:G29} m²", SvgIcons.MapPin));
                
                if (showAreaConstruccion && _data.AreaConstruccion.HasValue)
                    features.Add(("Área Cubierta", $"{_data.AreaConstruccion.Value:G29} m²", SvgIcons.Maximize));

                if (showHabitaciones)
                    features.Add(("Habitaciones", _data.Habitaciones.ToString(), SvgIcons.Bed));

                if (isNotTerreno)
                {
                    features.Add(("Baños", _data.Banos.ToString("G29"), SvgIcons.Bath));
                    if (_data.MediosBanos.HasValue) features.Add(("Medios Baños", _data.MediosBanos.Value.ToString(), SvgIcons.Bath));
                    if (_data.Estacionamientos.HasValue) features.Add(("Parqueaderos", _data.Estacionamientos.Value.ToString(), SvgIcons.Car));
                    if (_data.AniosAntiguedad.HasValue) features.Add(("Antigüedad", $"{_data.AniosAntiguedad.Value} años", SvgIcons.CalendarDays));
                }

                // Ajustar columnas dinámicamente según cantidad (max 5) para que no queden huecos muy grandes
                var cols = Math.Min(5, features.Count);
                
                table.ColumnsDefinition(columns =>
                {
                    for (int i = 0; i < cols; i++)
                    {
                        columns.RelativeColumn();
                    }
                });

                foreach (var feature in features)
                {
                    table.Cell().PaddingBottom(15).PaddingRight(5).PaddingLeft(5).Element(c => FeatureBox(c, feature.Label, feature.Value, feature.Icon));
                }
            });

            // Descripción
            col.Item().PaddingTop(5).Text("DESCRIPCIÓN").FontSize(12).ExtraBold().FontColor(PdfTheme.ColorTextoPrincipal).LetterSpacing(0.05f);
            col.Item().PaddingTop(8).Text(_data.Descripcion).FontSize(10).LineHeight(1.5f).Justify().FontColor(PdfTheme.ColorTextoPrincipal);
        });
    }

    private void FeatureBox(IContainer container, string label, string value, string icon)
    {
        container.Column(col =>
        {
            col.Item().AlignCenter().Width(20).Height(20).Svg(SvgIcons.WithColor(icon, PdfTheme.ColorAzulPrimario));
            col.Item().AlignCenter().PaddingTop(6).Text(value).FontSize(13).Bold().FontColor(PdfTheme.ColorTextoPrincipal);
            col.Item().AlignCenter().PaddingTop(2).Text(label.ToUpper()).FontSize(7).Light().FontColor(PdfTheme.ColorTextoSecundario);
        });
    }
}
