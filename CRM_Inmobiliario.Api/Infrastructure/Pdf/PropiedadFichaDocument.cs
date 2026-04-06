using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace CRM_Inmobiliario.Api.Infrastructure.Pdf;

public record FichaPdfData(
    string Titulo,
    string Descripcion,
    string TipoPropiedad,
    string Operacion,
    decimal Precio,
    string UbicacionCompleta,
    int Habitaciones,
    decimal Banos,
    decimal AreaTotal,
    byte[]? ImagenPrincipal,
    string AgenteNombre,
    string AgenteContacto,
    string? AgenciaNombre,
    byte[]? AgenteLogo,
    List<FichaSeccionData> Secciones);

public record FichaSeccionData(
    string Nombre,
    string? Descripcion,
    List<FichaImagenData> Imagenes);

public record FichaImagenData(
    byte[] Content,
    string? Descripcion);

public class PropiedadFichaDocument : IDocument
{
    private readonly FichaPdfData _data;

    // Colores de Marca
    private const string ColorAzulPrimario = "#1E3A8A";
    private const string ColorTextoPrincipal = "#0F172A";
    private const string ColorTextoSecundario = "#64748B";
    private const string ColorFooterFondo = "#0F172A";

    public PropiedadFichaDocument(FichaPdfData data)
    {
        _data = data;
    }

    public DocumentMetadata GetMetadata() => DocumentMetadata.Default;
    public DocumentSettings GetSettings() => DocumentSettings.Default;

    public void Compose(IDocumentContainer container)
    {
        container.Page(page =>
        {
            page.Size(PageSizes.A4);
            page.Margin(1, Unit.Centimetre);
            
            // EL fondo que te gustó para el precio, ahora para TODO el PDF
            page.PageColor(Colors.Blue.Lighten5); 
            
            page.DefaultTextStyle(x => x.FontSize(10).FontFamily("Helvetica").FontColor(ColorTextoPrincipal));

            page.Header().Element(ComposeHeader);
            page.Content().Element(ComposeContent);
            page.Footer().Element(ComposeFooter);
        });

        // Páginas de Galería (Secciones)
        foreach (var seccion in _data.Secciones)
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(1, Unit.Centimetre);
                page.PageColor(Colors.Blue.Lighten5); // Consistencia en todo el PDF
                page.DefaultTextStyle(x => x.FontSize(10).FontFamily("Helvetica").FontColor(ColorTextoPrincipal));

                page.Content().Element(container => ComposeSeccion(container, seccion));
                page.Footer().Element(ComposeFooter);
            });
        }
    }

    private void ComposeHeader(IContainer container)
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
                        c.Item().Text(_data.AgenciaNombre ?? "Inmobiliaria").FontSize(22).ExtraBold().FontColor(ColorAzulPrimario);
                        c.Item().Text("FICHA TÉCNICA").FontSize(8).FontColor(ColorTextoSecundario).LetterSpacing(0.2f);
                    });
                }
                
                row.RelativeItem().AlignRight().Column(c => {
                    c.Item().Text("CONTACTO").FontSize(7).FontColor(ColorTextoSecundario).LetterSpacing(0.1f);
                    c.Item().Text(_data.AgenteNombre).FontSize(11).SemiBold().FontColor(ColorTextoPrincipal);
                    c.Item().Text(_data.AgenteContacto).FontSize(9).FontColor(ColorTextoSecundario);
                });
            });

            // LÍNEA HORIZONTAL ROJA (Nueva Solicitud)
            headerCol.Item().PaddingTop(8).BorderBottom(2).BorderColor(Colors.Red.Medium);

            // Fila 2: Título y Precio
            headerCol.Item().PaddingTop(15).Row(row =>
            {
                row.RelativeItem().Column(col =>
                {
                    col.Item().Text(_data.Titulo).FontSize(26).ExtraBold().FontColor(ColorTextoPrincipal).LineHeight(1.0f);
                    col.Item().PaddingTop(4).Text(_data.UbicacionCompleta.ToUpper()).FontSize(9).FontColor(ColorTextoSecundario).LetterSpacing(0.02f);
                });

                row.ConstantItem(160).Column(col =>
                {
                    col.Item().AlignRight().Text(_data.Precio.ToString("C0")).FontSize(24).ExtraBold().FontColor(ColorAzulPrimario);
                    col.Item().AlignRight().Text("PRECIO DE LISTA").FontSize(7).Bold().FontColor(ColorAzulPrimario).LetterSpacing(0.05f);
                });
            });
        });
    }

    private void ComposeContent(IContainer container)
    {
        container.Column(col =>
        {
            // Imagen Principal (World-Class Framing + PaddingTop solicitado)
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

            // Características Grid (Strict Minimalist Pattern)
            col.Item().PaddingVertical(25).Row(row =>
            {
                row.RelativeItem().Element(c => FeatureBox(c, "Habitaciones", _data.Habitaciones.ToString()));
                row.RelativeItem().Element(c => FeatureBox(c, "Baños", _data.Banos.ToString("G29")));
                row.RelativeItem().Element(c => FeatureBox(c, "Área Total", $"{_data.AreaTotal} m²"));
                row.RelativeItem().Element(c => FeatureBox(c, "Tipo", _data.TipoPropiedad));
                row.RelativeItem().Element(c => FeatureBox(c, "Operación", _data.Operacion));
            });

            // Descripción
            col.Item().PaddingTop(5).Text("DESCRIPCIÓN").FontSize(12).ExtraBold().FontColor(ColorTextoPrincipal).LetterSpacing(0.05f);
            col.Item().PaddingTop(8).Text(_data.Descripcion).FontSize(10).LineHeight(1.5f).Justify().FontColor(ColorTextoPrincipal);
        });
    }

    private void FeatureBox(IContainer container, string label, string value)
    {
        container.Column(col =>
        {
            col.Item().AlignCenter().Text(value).FontSize(14).Bold().FontColor(ColorAzulPrimario);
            col.Item().AlignCenter().PaddingTop(2).Text(label.ToUpper()).FontSize(7).Light().FontColor(ColorTextoSecundario);
        });
    }

    private void ComposeSeccion(IContainer container, FichaSeccionData seccion)
    {
        container.PaddingVertical(10).Column(col =>
        {
            col.Item().Row(row => {
                row.ConstantItem(5).Background(ColorAzulPrimario);
                row.RelativeItem().PaddingLeft(10).Column(titleCol => {
                    titleCol.Item().Text(seccion.Nombre).FontSize(18).ExtraBold().FontColor(ColorTextoPrincipal);
                    if (!string.IsNullOrEmpty(seccion.Descripcion))
                        titleCol.Item().Text(seccion.Descripcion).FontSize(9).FontColor(ColorTextoSecundario);
                });
            });

            col.Item().PaddingTop(20).Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.RelativeColumn();
                    columns.RelativeColumn();
                });

                foreach (var img in seccion.Imagenes)
                {
                    table.Cell().Padding(10).Column(imgCol =>
                    {
                        // IMÁGENES DE GALERÍA (REVERTIDAS A LA VERSIÓN ORIGINAL)
                        imgCol.Item()
                              .Height(150)
                              .Background(Colors.Grey.Lighten4)
                              .AlignCenter()
                              .AlignMiddle()
                              .Image(img.Content)
                              .FitArea();

                        if (!string.IsNullOrEmpty(img.Descripcion))
                            imgCol.Item().PaddingTop(5).AlignCenter().Text(img.Descripcion).FontSize(8).Italic().FontColor(ColorTextoSecundario);
                    });
                }
            });
        });
    }

    private void ComposeFooter(IContainer container)
    {
        container.PaddingHorizontal(20).Column(footerCol =>
        {
            // LÍNEA HORIZONTAL ROJA (Igual que en el header)
            footerCol.Item().PaddingBottom(8).BorderTop(2).BorderColor(Colors.Red.Medium);

            footerCol.Item().Row(row =>
            {
                row.RelativeItem().Column(c => {
                    c.Item().Text(x =>
                    {
                        x.Span("Ficha generada por ").FontSize(8).FontColor(ColorTextoSecundario);
                        x.Span(_data.AgenciaNombre ?? "CRM Inmobiliario").FontSize(8).Bold().FontColor(ColorAzulPrimario);
                    });
                    c.Item().Text("Documento de carácter informativo. Sujeto a cambios sin previo aviso.").FontSize(6).FontColor(ColorTextoSecundario);
                });

                row.RelativeItem().AlignRight().AlignMiddle().Text(x =>
                {
                    x.Span("PÁGINA ").FontSize(8).FontColor(ColorTextoSecundario);
                    x.CurrentPageNumber().FontSize(8).Bold().FontColor(ColorAzulPrimario);
                    x.Span(" DE ").FontSize(8).FontColor(ColorTextoSecundario);
                    x.TotalPages().FontSize(8).Bold().FontColor(ColorAzulPrimario);
                });
            });
        });
    }
}