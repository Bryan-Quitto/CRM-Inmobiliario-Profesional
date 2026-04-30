using QuestPDF.Fluent;
using QuestPDF.Infrastructure;
using CRM_Inmobiliario.Api.Infrastructure.Pdf.Models;
using CRM_Inmobiliario.Api.Infrastructure.Pdf.Theme;

namespace CRM_Inmobiliario.Api.Infrastructure.Pdf.Components;

public class FichaFooterComponent : IComponent
{
    private readonly FichaPdfData _data;

    public FichaFooterComponent(FichaPdfData data)
    {
        _data = data;
    }

    public void Compose(IContainer container)
    {
        container.PaddingHorizontal(20).Column(footerCol =>
        {
            // LÍNEA HORIZONTAL ROJA
            footerCol.Item().PaddingBottom(8).BorderTop(2).BorderColor(PdfTheme.ColorLineRed);

            footerCol.Item().Row(row =>
            {
                row.RelativeItem().Column(c => {
                    c.Item().Text(x =>
                    {
                        x.Span("Ficha generada por ").FontSize(8).FontColor(PdfTheme.ColorTextoSecundario);
                        x.Span(_data.AgenciaNombre ?? "CRM Inmobiliario").FontSize(8).Bold().FontColor(PdfTheme.ColorAzulPrimario);
                    });
                    c.Item().Text("Documento de carácter informativo. Sujeto a cambios sin previo aviso.").FontSize(6).FontColor(PdfTheme.ColorTextoSecundario);
                });

                row.RelativeItem().AlignRight().AlignMiddle().Text(x =>
                {
                    x.Span("PÁGINA ").FontSize(8).FontColor(PdfTheme.ColorTextoSecundario);
                    x.CurrentPageNumber().FontSize(8).Bold().FontColor(PdfTheme.ColorAzulPrimario);
                    x.Span(" DE ").FontSize(8).FontColor(PdfTheme.ColorTextoSecundario);
                    x.TotalPages().FontSize(8).Bold().FontColor(PdfTheme.ColorAzulPrimario);
                });
            });
        });
    }
}
