using FluentValidation;

namespace CRM_Inmobiliario.Api.Features.Propiedades;

public class ActualizarPropiedadCommandValidator : AbstractValidator<ActualizarPropiedadFeature.Command>
{
    public ActualizarPropiedadCommandValidator()
    {
        RuleFor(x => x.Titulo)
            .NotEmpty().WithMessage("El título es requerido.")
            .MaximumLength(150).WithMessage("El título no puede exceder los 150 caracteres.");

        RuleFor(x => x.Descripcion)
            .NotEmpty().WithMessage("La descripción es requerida.")
            .MinimumLength(20).WithMessage("Debe proporcionar una descripción detallada (mín. 20 caracteres).")
            .MaximumLength(1000).WithMessage("La descripción no puede exceder los 1000 caracteres.");

        RuleFor(x => x.TipoPropiedad)
            .NotEmpty().WithMessage("El tipo de propiedad es requerido.")
            .MaximumLength(50);

        RuleFor(x => x.Operacion)
            .NotEmpty().WithMessage("La operación es requerida.")
            .MaximumLength(50);

        RuleFor(x => x.Precio)
            .GreaterThan(0).WithMessage("El precio debe ser mayor a cero.")
            .PrecisionScale(18, 2, true).WithMessage("El precio debe tener máximo 2 decimales y 18 dígitos en total.");

        RuleFor(x => x.Direccion)
            .NotEmpty().WithMessage("La dirección es requerida.")
            .MaximumLength(255).WithMessage("La dirección no puede exceder los 255 caracteres.");

        RuleFor(x => x.Sector)
            .NotEmpty().WithMessage("El sector es requerido.")
            .MaximumLength(100).WithMessage("El sector no puede exceder los 100 caracteres.");

        RuleFor(x => x.Ciudad)
            .NotEmpty().WithMessage("La ciudad es requerida.")
            .MaximumLength(100).WithMessage("La ciudad no puede exceder los 100 caracteres.");

        RuleFor(x => x.GoogleMapsUrl)
            .Must(uri => Uri.IsWellFormedUriString(uri, UriKind.Absolute))
            .When(x => !string.IsNullOrEmpty(x.GoogleMapsUrl))
            .WithMessage("Debe ser una URL válida.");

        RuleFor(x => x.UrlRemax)
            .MaximumLength(1000)
            .Must(uri => Uri.IsWellFormedUriString(uri, UriKind.Absolute))
            .When(x => !string.IsNullOrEmpty(x.UrlRemax))
            .WithMessage("Debe ser una URL válida.");

        RuleFor(x => x.Habitaciones)
            .GreaterThanOrEqualTo(0).WithMessage("La cantidad de habitaciones no puede ser negativa.");

        RuleFor(x => x.Banos)
            .GreaterThanOrEqualTo(0).WithMessage("La cantidad de baños no puede ser negativa.")
            .PrecisionScale(4, 1, true).WithMessage("Los baños deben tener máximo 1 decimal.");

        RuleFor(x => x.AreaTotal)
            .GreaterThanOrEqualTo(0).WithMessage("El área total no puede ser negativa.")
            .PrecisionScale(18, 2, true).WithMessage("El área total debe tener máximo 2 decimales y 18 dígitos en total.");

        RuleFor(x => x.AreaTerreno)
            .GreaterThanOrEqualTo(0).WithMessage("El área de terreno no puede ser negativa.")
            .PrecisionScale(18, 2, true)
            .When(x => x.AreaTerreno.HasValue);

        RuleFor(x => x.AreaConstruccion)
            .GreaterThanOrEqualTo(0).WithMessage("El área de construcción no puede ser negativa.")
            .PrecisionScale(18, 2, true)
            .When(x => x.AreaConstruccion.HasValue);

        RuleFor(x => x.Estacionamientos)
            .GreaterThanOrEqualTo(0)
            .When(x => x.Estacionamientos.HasValue);

        RuleFor(x => x.MediosBanos)
            .GreaterThanOrEqualTo(0)
            .When(x => x.MediosBanos.HasValue);

        RuleFor(x => x.AniosAntiguedad)
            .GreaterThanOrEqualTo(0)
            .When(x => x.AniosAntiguedad.HasValue);

        RuleFor(x => x.EsCaptacionPropia)
            .NotNull();

        RuleFor(x => x.PorcentajeComision)
            .InclusiveBetween(0, 100).WithMessage("El porcentaje de comisión debe estar entre 0 y 100.")
            .PrecisionScale(5, 2, true);
    }
}
