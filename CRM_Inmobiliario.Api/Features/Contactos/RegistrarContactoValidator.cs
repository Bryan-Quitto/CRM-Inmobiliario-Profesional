using FluentValidation;

namespace CRM_Inmobiliario.Api.Features.Contactos;

public class RegistrarContactoCommandValidator : AbstractValidator<RegistrarContactoFeature.Command>
{
    public RegistrarContactoCommandValidator()
    {
        RuleFor(x => x.Nombre)
            .NotEmpty().WithMessage("El nombre es requerido.")
            .MaximumLength(100).WithMessage("El nombre no puede exceder los 100 caracteres.");

        RuleFor(x => x.Apellido)
            .MaximumLength(100).WithMessage("El apellido no puede exceder los 100 caracteres.");

        RuleFor(x => x.Email)
            .EmailAddress().WithMessage("El formato de email no es válido.")
            .MaximumLength(150).WithMessage("El email no puede exceder los 150 caracteres.")
            .When(x => !string.IsNullOrEmpty(x.Email));

        RuleFor(x => x.Telefono)
            .MaximumLength(20).WithMessage("El teléfono no puede exceder los 20 caracteres.")
            .Matches(@"^\+?[0-9\s\-]+$").WithMessage("El formato del teléfono es inválido.")
            .When(x => !string.IsNullOrEmpty(x.Telefono));

        RuleFor(x => x.Origen)
            .NotEmpty().WithMessage("El origen es requerido.")
            .MaximumLength(50).WithMessage("El origen no puede exceder los 50 caracteres.");

        RuleFor(x => x.EsCliente)
            .NotNull();

        RuleFor(x => x.EsPropietario)
            .NotNull();
    }
}
