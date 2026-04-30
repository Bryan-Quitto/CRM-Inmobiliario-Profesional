using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using CRM_Inmobiliario.Api.Infrastructure.Pdf.Models;
using CRM_Inmobiliario.Api.Infrastructure.Pdf.Theme;

namespace CRM_Inmobiliario.Api.Infrastructure.Pdf.Components;

public class FichaGallerySectionComponent : IComponent
{
    private readonly FichaSeccionData _seccion;

    public FichaGallerySectionComponent(FichaSeccionData seccion)
    {
        _seccion = seccion;
    }

    public void Compose(IContainer container)
    {
        container.PaddingVertical(10).Column(col =>
        {
            col.Item().Row(row => {
                row.ConstantItem(5).Background(PdfTheme.ColorAzulPrimario);
                row.RelativeItem().PaddingLeft(10).Column(titleCol => {
                    titleCol.Item().Text(_seccion.Nombre).FontSize(18).ExtraBold().FontColor(PdfTheme.ColorTextoPrincipal);
                    if (!string.IsNullOrEmpty(_seccion.Descripcion))
                        titleCol.Item().Text(_seccion.Descripcion).FontSize(9).FontColor(PdfTheme.ColorTextoSecundario);
                });
            });

            col.Item().PaddingTop(20).Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.RelativeColumn();
                    columns.RelativeColumn();
                });

                foreach (var img in _seccion.Imagenes)
                {
                    table.Cell().Padding(10).Column(imgCol =>
                    {
                        imgCol.Item()
                              .Height(150)
                              .Background(Colors.Grey.Lighten4)
                              .AlignCenter()
                              .AlignMiddle()
                              .Image(img.Content)
                              .FitArea();

                        if (!string.IsNullOrEmpty(img.Descripcion))
                            imgCol.Item().PaddingTop(5).AlignCenter().Text(img.Descripcion).FontSize(8).Italic().FontColor(PdfTheme.ColorTextoSecundario);
                    });
                }
            });
        });
    }
}
