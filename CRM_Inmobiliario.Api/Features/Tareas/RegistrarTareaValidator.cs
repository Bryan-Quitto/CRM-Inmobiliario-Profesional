using FluentValidation;

namespace CRM_Inmobiliario.Api.Features.Tareas;

public class RegistrarTareaCommandValidator : AbstractValidator<RegistrarTareaFeature.Command>
{
    public RegistrarTareaCommandValidator()
    {
        RuleFor(x => x.Titulo)
            .NotEmpty().WithMessage("El título es obligatorio.")
            .MaximumLength(150).WithMessage("El título no puede exceder los 150 caracteres.");

        RuleFor(x => x.Descripcion)
            .MaximumLength(500).WithMessage("La descripción es demasiado larga.")
            .When(x => !string.IsNullOrEmpty(x.Descripcion));

        RuleFor(x => x.TipoTarea)
            .NotEmpty().WithMessage("El tipo de tarea es obligatorio.")
            .MaximumLength(50)
            .Must(t => t == "Llamada" || t == "Visita" || t == "Reunión" || t == "Trámite")
            .WithMessage("El tipo de tarea debe ser Llamada, Visita, Reunión o Trámite.");

        RuleFor(x => x.FechaInicio)
            .NotEmpty().WithMessage("La fecha de inicio es obligatoria.")
            .InclusiveBetween(new DateTime(2000, 1, 1), new DateTime(2100, 1, 1))
            .WithMessage("La fecha ingresada está fuera de los límites permitidos (2000 a 2100).");

        RuleFor(x => x.DuracionMinutos)
            .InclusiveBetween(0, 600).WithMessage("La duración debe estar entre 0 y 600 minutos.")
            .When(x => x.DuracionMinutos.HasValue);

        RuleFor(x => x.ColorHex)
            .MaximumLength(7).WithMessage("Color inválido.")
            .Matches("^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$").WithMessage("Color inválido.")
            .When(x => !string.IsNullOrEmpty(x.ColorHex));

        RuleFor(x => x.ContactoId)
            .NotEmpty().WithMessage("El ID del contacto es inválido.")
            .When(x => x.ContactoId.HasValue);

        RuleFor(x => x.PropiedadId)
            .NotEmpty().WithMessage("El ID de la propiedad es inválido.")
            .When(x => x.PropiedadId.HasValue);

        RuleFor(x => x.Lugar)
            .MaximumLength(255).WithMessage("El lugar no puede exceder los 255 caracteres.")
            .When(x => !string.IsNullOrEmpty(x.Lugar));
    }
}
