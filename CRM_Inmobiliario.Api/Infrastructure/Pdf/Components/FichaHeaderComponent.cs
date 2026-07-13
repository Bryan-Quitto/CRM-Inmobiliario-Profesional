using QuestPDF.Fluent;
using QuestPDF.Infrastructure;
using System.Linq;
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
                row.RelativeItem().Row(leftRow => 
                {
                    if (_data.AgenteFoto != null)
                    {
                        leftRow.ConstantItem(35).Height(35).Image(_data.AgenteFoto).FitArea();
                        leftRow.ConstantItem(10); // Espaciado
                    }
                    
                    leftRow.RelativeItem().Column(c => {
                        c.Item().Text("CONTACTO").FontSize(7).FontColor(PdfTheme.ColorTextoSecundario).LetterSpacing(0.1f);
                        c.Item().Text(_data.AgenteNombre).FontSize(11).Black().FontColor(PdfTheme.ColorTextoPrincipal);
                        if (!string.IsNullOrEmpty(_data.AgenteContacto))
                        {
                            var formattedPhone = new string(_data.AgenteContacto.Where(char.IsDigit).ToArray());
                            var message = $"Hola, estoy interesado en la propiedad *{_data.Titulo}* que publicó, me podría ayudar con más información por favor";
                            var link = $"https://wa.me/{formattedPhone}?text={System.Uri.EscapeDataString(message)}";

                            c.Item().Hyperlink(link).Row(r => 
                            {
                                r.AutoItem().Text(_data.AgenteContacto).FontSize(9).Medium().FontColor(PdfTheme.ColorAzulPrimario);
                                r.AutoItem().PaddingLeft(4).PaddingTop(1).Width(10).Height(10).Svg(SvgIcons.WithColor(SvgIcons.WhatsApp, PdfTheme.ColorAzulPrimario));
                            });
                        }
                        if (!string.IsNullOrEmpty(_data.AgenciaNombre)) 
                        {
                            c.Item().PaddingTop(2).Text(_data.AgenciaNombre.ToUpper()).FontSize(8).Bold().FontColor(PdfTheme.ColorTextoSecundario);
                        }
                    });
                });
                
                var rightPart = row.RelativeItem().AlignRight();
                if (_data.AgenteLogo != null)
                {
                    rightPart.Height(50).Image(_data.AgenteLogo).FitArea();
                }
                else
                {
                    rightPart.Column(c => {
                        c.Item().AlignRight().Text(_data.AgenciaNombre ?? "Inmobiliaria").FontSize(22).ExtraBold().FontColor(PdfTheme.ColorAzulPrimario);
                        c.Item().AlignRight().Text("FICHA TÉCNICA").FontSize(8).FontColor(PdfTheme.ColorTextoSecundario).LetterSpacing(0.2f);
                    });
                }
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
