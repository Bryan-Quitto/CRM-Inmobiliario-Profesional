using FluentValidation;

namespace CRM_Inmobiliario.Api.Features.Configuracion;

public class CreateAgencyRequestValidator : AbstractValidator<AgenciasFeatures.CreateAgencyRequest>
{
    public CreateAgencyRequestValidator()
    {
        RuleFor(x => x.Nombre)
            .NotEmpty().WithMessage("El nombre de la agencia es requerido.")
            .MaximumLength(150).WithMessage("El nombre de la agencia no puede exceder los 150 caracteres.");

        RuleFor(x => x.TelefonoCorporativo)
            .MaximumLength(20).WithMessage("El teléfono corporativo no puede exceder los 20 caracteres.");

        RuleFor(x => x.EmailCorporativo)
            .EmailAddress().WithMessage("El formato del email corporativo es inválido.")
            .MaximumLength(255).WithMessage("El email corporativo no puede exceder los 255 caracteres.")
            .When(x => !string.IsNullOrEmpty(x.EmailCorporativo));

        RuleFor(x => x.DireccionFisica)
            .MaximumLength(500).WithMessage("La dirección física no puede exceder los 500 caracteres.");

        RuleFor(x => x.SitioWeb)
            .MaximumLength(255).WithMessage("El sitio web no puede exceder los 255 caracteres.")
            .Must(uri => Uri.IsWellFormedUriString(uri, UriKind.Absolute)).WithMessage("Debe ser una URL válida.")
            .When(x => !string.IsNullOrEmpty(x.SitioWeb));

        RuleFor(x => x.ContextoCorporativoIA)
            .MaximumLength(2000).WithMessage("El contexto corporativo IA no puede exceder los 2000 caracteres.");
    }
}

public class UpdateAgencyRequestValidator : AbstractValidator<AgenciasFeatures.UpdateAgencyRequest>
{
    public UpdateAgencyRequestValidator()
    {
        RuleFor(x => x.Nombre)
            .NotEmpty().WithMessage("El nombre de la agencia es requerido.")
            .MaximumLength(150).WithMessage("El nombre de la agencia no puede exceder los 150 caracteres.");

        RuleFor(x => x.TelefonoCorporativo)
            .MaximumLength(20).WithMessage("El teléfono corporativo no puede exceder los 20 caracteres.");

        RuleFor(x => x.EmailCorporativo)
            .EmailAddress().WithMessage("El formato del email corporativo es inválido.")
            .MaximumLength(255).WithMessage("El email corporativo no puede exceder los 255 caracteres.")
            .When(x => !string.IsNullOrEmpty(x.EmailCorporativo));

        RuleFor(x => x.DireccionFisica)
            .MaximumLength(500).WithMessage("La dirección física no puede exceder los 500 caracteres.");

        RuleFor(x => x.SitioWeb)
            .MaximumLength(255).WithMessage("El sitio web no puede exceder los 255 caracteres.")
            .Must(uri => Uri.IsWellFormedUriString(uri, UriKind.Absolute)).WithMessage("Debe ser una URL válida.")
            .When(x => !string.IsNullOrEmpty(x.SitioWeb));

        RuleFor(x => x.ContextoCorporativoIA)
            .MaximumLength(2000).WithMessage("El contexto corporativo IA no puede exceder los 2000 caracteres.");
    }
}
