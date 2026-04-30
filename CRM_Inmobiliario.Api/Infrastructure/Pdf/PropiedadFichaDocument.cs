using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using CRM_Inmobiliario.Api.Infrastructure.Pdf.Models;
using CRM_Inmobiliario.Api.Infrastructure.Pdf.Theme;
using CRM_Inmobiliario.Api.Infrastructure.Pdf.Components;

namespace CRM_Inmobiliario.Api.Infrastructure.Pdf;

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
        // Página Principal: Resumen y Datos Técnicos
        container.Page(page =>
        {
            page.Size(PageSizes.A4);
            page.Margin(1, Unit.Centimetre);
            page.PageColor(PdfTheme.ColorBackground); 
            
            page.DefaultTextStyle(x => x.FontSize(10).FontFamily("Helvetica").FontColor(PdfTheme.ColorTextoPrincipal));

            page.Header().Component(new FichaHeaderComponent(_data));
            page.Content().Component(new FichaContentComponent(_data));
            page.Footer().Component(new FichaFooterComponent(_data));
        });

        // Páginas de Galería (Secciones)
        foreach (var seccion in _data.Secciones)
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(1, Unit.Centimetre);
                page.PageColor(PdfTheme.ColorBackground); 
                page.DefaultTextStyle(x => x.FontSize(10).FontFamily("Helvetica").FontColor(PdfTheme.ColorTextoPrincipal));

                page.Content().Component(new FichaGallerySectionComponent(seccion));
                page.Footer().Component(new FichaFooterComponent(_data));
            });
        }
    }
}
