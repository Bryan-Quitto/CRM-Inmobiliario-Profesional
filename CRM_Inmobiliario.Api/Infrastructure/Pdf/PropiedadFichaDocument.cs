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
            page.PageColor(Colors.White);
            page.DefaultTextStyle(x => x.FontSize(10).FontFamily("Helvetica"));

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
                page.PageColor(Colors.White);
                page.DefaultTextStyle(x => x.FontSize(10).FontFamily("Helvetica"));

                page.Content().Element(container => ComposeSeccion(container, seccion));
                page.Footer().Element(ComposeFooter);
            });
        }
    }

    private void ComposeHeader(IContainer container)
    {
        container.PaddingBottom(10).Column(headerCol => 
        {
            // Fila 1: Branding de la Agencia vs Contacto Agente
            headerCol.Item().Row(row =>
            {
                // PARTE IZQUIERDA: Branding Principal
                var leftPart = row.RelativeItem();
                if (_data.AgenteLogo != null)
                {
                    leftPart.Height(50).Image(_data.AgenteLogo).FitArea();
                }
                else
                {
                    leftPart.Column(c => {
                        c.Item().Text(_data.AgenciaNombre ?? "Inmobiliaria").FontSize(20).Bold().FontColor(Colors.Blue.Medium);
                        c.Item().Text("FICHA TÉCNICA").FontSize(8).FontColor(Colors.Grey.Medium).LetterSpacing(0.2f);
                    });
                }
                
                // PARTE DERECHA: Información de Contacto (Sin redundancia de agencia)
                row.RelativeItem().AlignRight().Column(c => {
                    c.Item().Text("CONTACTO").FontSize(7).FontColor(Colors.Grey.Medium).LetterSpacing(0.1f);
                    c.Item().Text(_data.AgenteNombre).FontSize(10).SemiBold().FontColor(Colors.Blue.Medium);
                    c.Item().Text(_data.AgenteContacto).FontSize(8).FontColor(Colors.Grey.Darken1);
                });
            });

            headerCol.Item().PaddingTop(5).BorderBottom(1, Unit.Point).BorderColor(Colors.Grey.Lighten2);

            // Fila 2: Información de la Propiedad (Título, Ubicación, Precio)
            headerCol.Item().PaddingTop(10).Row(row =>
            {
                row.RelativeItem().Column(col =>
                {
                    col.Item().Text(_data.Titulo).FontSize(18).SemiBold().FontColor(Colors.Blue.Medium);
                    col.Item().Text(_data.UbicacionCompleta).FontSize(8).FontColor(Colors.Grey.Medium);
                });

                row.ConstantItem(120).Column(col =>
                {
                    col.Item().AlignRight().Text(_data.Precio.ToString("C0")).FontSize(16).SemiBold().FontColor(Colors.Blue.Medium);
                    col.Item().AlignRight().Text("PRECIO DE LISTA").FontSize(6).FontColor(Colors.Grey.Medium);
                });
            });
        });
    }

    private void ComposeContent(IContainer container)
    {
        container.PaddingVertical(5).Column(col =>
        {
            // Imagen Principal (CORREGIDA LA CONSTRICCIÓN GEOMÉTRICA)
            if (_data.ImagenPrincipal != null)
            {
                col.Item()
                   .Height(300) // Fijamos el alto total del contenedor
                   .Background(Colors.Grey.Lighten4) // Añadimos fondo por si la foto no llena el espacio
                   .AlignCenter()
                   .AlignMiddle()
                   .Image(_data.ImagenPrincipal)
                   .FitArea(); // Esto es clave: "Ocupa el mayor espacio posible del 538x300 sin deformarte"
            }

            // Características Grid
            col.Item().PaddingTop(10).Row(row =>
            {
                row.RelativeItem().Element(c => FeatureBox(c, "Habitaciones", _data.Habitaciones.ToString()));
                row.RelativeItem().Element(c => FeatureBox(c, "Baños", _data.Banos.ToString("G29")));
                row.RelativeItem().Element(c => FeatureBox(c, "Área Total", $"{_data.AreaTotal} m²"));
                row.RelativeItem().Element(c => FeatureBox(c, "Tipo", _data.TipoPropiedad));
                row.RelativeItem().Element(c => FeatureBox(c, "Operación", _data.Operacion));
            });

            // Descripción
            col.Item().PaddingTop(15).Text("Descripción del Inmueble").FontSize(12).SemiBold().FontColor(Colors.Grey.Darken2);
            
            // Si la descripción es enorme, permitimos que salte a otra página si la foto llenó todo el espacio
            col.Item().PaddingTop(5).Text(_data.Descripcion).FontSize(9).LineHeight(1.4f).Justify();
        });
    }

    private void FeatureBox(IContainer container, string label, string value)
    {
        container.Padding(2).Background(Colors.Grey.Lighten4).Padding(5).Column(col =>
        {
            col.Item().AlignCenter().Text(label.ToUpper()).FontSize(7).FontColor(Colors.Grey.Medium);
            col.Item().AlignCenter().Text(value).FontSize(9).SemiBold();
        });
    }

    private void ComposeSeccion(IContainer container, FichaSeccionData seccion)
    {
        container.PaddingVertical(10).Column(col =>
        {
            col.Item().BorderBottom(1).BorderColor(Colors.Blue.Lighten4).Text(seccion.Nombre).FontSize(14).SemiBold().FontColor(Colors.Blue.Medium);
            
            if (!string.IsNullOrEmpty(seccion.Descripcion))
                col.Item().PaddingTop(5).Text(seccion.Descripcion).FontSize(8).FontColor(Colors.Grey.Darken1);

            col.Item().PaddingTop(10).Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.RelativeColumn();
                    columns.RelativeColumn();
                });

                foreach (var img in seccion.Imagenes)
                {
                    table.Cell().Padding(5).Column(imgCol =>
                    {
                        // Imágenes de la galería: también corregidas con Height explícito y FitArea()
                        imgCol.Item()
                              .Height(150)
                              .Background(Colors.Grey.Lighten4)
                              .AlignCenter()
                              .AlignMiddle()
                              .Image(img.Content)
                              .FitArea();

                        if (!string.IsNullOrEmpty(img.Descripcion))
                            imgCol.Item().PaddingTop(2).Text(img.Descripcion).FontSize(7).FontColor(Colors.Grey.Medium);
                    });
                }
            });
        });
    }

    private void ComposeFooter(IContainer container)
    {
        container.PaddingTop(10).BorderTop(1).BorderColor(Colors.Grey.Lighten3).Row(row =>
        {
            row.RelativeItem().Text(x =>
            {
                x.Span("Ficha generada por ").FontSize(7).FontColor(Colors.Grey.Medium);
                x.Span(_data.AgenciaNombre ?? "CRM Inmobiliario").FontSize(7).SemiBold().FontColor(Colors.Grey.Medium);
            });

            row.RelativeItem().AlignRight().Text(x =>
            {
                x.Span("Página ");
                x.CurrentPageNumber();
                x.Span(" de ");
                x.TotalPages();
            });
        });
    }
}