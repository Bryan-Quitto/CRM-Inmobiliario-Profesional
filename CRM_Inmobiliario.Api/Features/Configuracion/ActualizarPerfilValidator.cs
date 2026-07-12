using FluentValidation;

namespace CRM_Inmobiliario.Api.Features.Configuracion;

public class ActualizarPerfilRequestValidator : AbstractValidator<ActualizarPerfil.Request>
{
    public ActualizarPerfilRequestValidator()
    {
        RuleFor(x => x.Nombre)
            .NotEmpty().WithMessage("El nombre es requerido.")
            .MaximumLength(100).WithMessage("El nombre no puede exceder los 100 caracteres y debe contener al menos 1 caracter.")
            .Matches(@"^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$").WithMessage("El nombre solo puede contener letras y espacios.");

        RuleFor(x => x.Apellido)
            .NotEmpty().WithMessage("El apellido es requerido.")
            .MaximumLength(100).WithMessage("El apellido no puede exceder los 100 caracteres y debe contener al menos 1 caracter.")
            .Matches(@"^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$").WithMessage("El apellido solo puede contener letras y espacios.");

        RuleFor(x => x.Telefono)
            .NotEmpty().WithMessage("El teléfono es requerido.")
            .MaximumLength(20).WithMessage("El teléfono no puede exceder los 20 caracteres.");

        RuleFor(x => x.DireccionFisica)
            .MaximumLength(500).WithMessage("La dirección física no puede exceder los 500 caracteres.");

        RuleFor(x => x.PromptPersonalIA)
            .MaximumLength(2000).WithMessage("El prompt personal no puede exceder 2000 caracteres.");
    }
}
