using QuestPDF.Fluent;
using QuestPDF.Infrastructure;
using CRM_Inmobiliario.Api.Infrastructure.Pdf.Models;
using CRM_Inmobiliario.Api.Infrastructure.Pdf.Theme;

namespace CRM_Inmobiliario.Api.Infrastructure.Pdf.Components;

public class FichaHeaderComponent : IComponent
{
    private readonly FichaPdfData _data;

    public FichaHeaderComponent(FichaPdfData data)
    {
        _data = data;
    }

    public void Compose(IContainer container)
    {
        container.PaddingBottom(15).Column(headerCol => 
        {
            // Fila 1: Branding Principal vs Contacto
            headerCol.Item().Row(row =>
            {
                var leftPart = row.RelativeItem();
                if (_data.AgenteLogo != null)
                {
                    leftPart.Height(50).Image(_data.AgenteLogo).FitArea();
                }
                else
                {
                    leftPart.Column(c => {
                        c.Item().Text(_data.AgenciaNombre ?? "Inmobiliaria").FontSize(22).ExtraBold().FontColor(PdfTheme.ColorAzulPrimario);
                        c.Item().Text("FICHA TÉCNICA").FontSize(8).FontColor(PdfTheme.ColorTextoSecundario).LetterSpacing(0.2f);
                    });
                }
                
                row.RelativeItem().AlignRight().Column(c => {
                    c.Item().Text("CONTACTO").FontSize(7).FontColor(PdfTheme.ColorTextoSecundario).LetterSpacing(0.1f);
                    c.Item().Text(_data.AgenteNombre).FontSize(11).SemiBold().FontColor(PdfTheme.ColorTextoPrincipal);
                    c.Item().Text(_data.AgenteContacto).FontSize(9).FontColor(PdfTheme.ColorTextoSecundario);
                });
            });

            // LÍNEA HORIZONTAL ROJA
            headerCol.Item().PaddingTop(8).BorderBottom(2).BorderColor(PdfTheme.ColorLineRed);

            // Fila 2: Título y Precio
            headerCol.Item().PaddingTop(15).Row(row =>
            {
                row.RelativeItem().Column(col =>
                {
                    col.Item().Text(_data.Titulo).FontSize(26).ExtraBold().FontColor(PdfTheme.ColorTextoPrincipal).LineHeight(1.0f);
                    col.Item().PaddingTop(4).Text(_data.UbicacionCompleta.ToUpper()).FontSize(9).FontColor(PdfTheme.ColorTextoSecundario).LetterSpacing(0.02f);
                });

                row.ConstantItem(160).Column(col =>
                {
                    col.Item().AlignRight().Text(_data.Precio.ToString("C0")).FontSize(24).ExtraBold().FontColor(PdfTheme.ColorAzulPrimario);
                    col.Item().AlignRight().Text("PRECIO DE LISTA").FontSize(7).Bold().FontColor(PdfTheme.ColorAzulPrimario).LetterSpacing(0.05f);
                });
            });
        });
    }
}
