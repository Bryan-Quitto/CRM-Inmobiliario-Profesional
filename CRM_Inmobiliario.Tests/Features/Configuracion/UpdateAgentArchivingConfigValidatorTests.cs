using System;
using System.Linq;
using Xunit;
using FluentValidation.TestHelper;
using CRM_Inmobiliario.Api.Features.Configuracion;

namespace CRM_Inmobiliario.Tests.Features.Configuracion;

public class UpdateAgentArchivingConfigValidatorTests
{
    private readonly UpdateAgentArchivingConfigValidator _validator;

    public UpdateAgentArchivingConfigValidatorTests()
    {
        _validator = new UpdateAgentArchivingConfigValidator();
    }

    [Theory]
    [InlineData(100)]
    [InlineData(500)]
    [InlineData(1095)]
    public void Should_Not_Have_Error_When_DiasInactividad_Is_Valid(int dias)
    {
        // Arrange
        var request = new UpdateAgentArchivingConfigRequest
        {
            AutoArchivarContactos = true,
            DiasInactividadContactos = dias,
            AutoArchivarPropiedades = true,
            DiasInactividadPropiedades = dias
        };

        // Act
        var result = _validator.TestValidate(request);

        // Assert
        result.ShouldNotHaveValidationErrorFor(x => x.DiasInactividadContactos);
        result.ShouldNotHaveValidationErrorFor(x => x.DiasInactividadPropiedades);
    }

    [Theory]
    [InlineData(99)]
    [InlineData(1096)]
    [InlineData(0)]
    [InlineData(-10)]
    public void Should_Have_Error_When_DiasInactividad_Is_Out_Of_Range(int dias)
    {
        // Arrange
        var request = new UpdateAgentArchivingConfigRequest
        {
            AutoArchivarContactos = true,
            DiasInactividadContactos = dias,
            AutoArchivarPropiedades = true,
            DiasInactividadPropiedades = dias
        };

        // Act
        var result = _validator.TestValidate(request);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.DiasInactividadContactos)
            .WithErrorMessage("Los días de inactividad para contactos deben estar entre 100 y 1095.");
        
        result.ShouldHaveValidationErrorFor(x => x.DiasInactividadPropiedades)
            .WithErrorMessage("Los días de inactividad para propiedades deben estar entre 100 y 1095.");
    }
}
