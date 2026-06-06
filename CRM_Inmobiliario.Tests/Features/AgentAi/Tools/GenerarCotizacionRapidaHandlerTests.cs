using System;
using System.Text.Json;
using System.Threading.Tasks;
using CRM_Inmobiliario.Api.Features.AgentAi.Tools;
using CRM_Inmobiliario.Api.Features.CoreAi.Services;
using CRM_Inmobiliario.Api.Features.CoreAi.Services.Tools;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace CRM_Inmobiliario.Tests.Features.AgentAi.Tools
{
    public class GenerarCotizacionRapidaHandlerTests
    {
        private readonly Mock<ILogger<GenerarCotizacionRapidaHandler>> _loggerMock;
        private readonly GenerarCotizacionRapidaHandler _handler;

        public GenerarCotizacionRapidaHandlerTests()
        {
            _loggerMock = new Mock<ILogger<GenerarCotizacionRapidaHandler>>();
            _handler = new GenerarCotizacionRapidaHandler(_loggerMock.Object);
        }

        private JsonDocument CreateJsonArgs(decimal montoPropiedad, decimal enganche, decimal tasaInteresAnual, int[] plazosMeses)
        {
            var data = new
            {
                montoPropiedad,
                enganche,
                tasaInteresAnual,
                plazosMeses
            };
            return JsonDocument.Parse(JsonSerializer.Serialize(data));
        }

        [Fact]
        public void ToolName_DebeSerGenerarCotizacionRapida()
        {
            // Assert
            Assert.Equal("GenerarCotizacionRapida", _handler.ToolName);
        }

        [Theory]
        [InlineData(0, 1000, 10, new int[] { 120 })]
        [InlineData(-50000, 1000, 10, new int[] { 120 })]
        public async Task ExecuteAsync_RetornaError_CuandoMontoPropiedadInvalido(decimal monto, decimal enganche, decimal tasa, int[] plazos)
        {
            // Arrange
            var args = CreateJsonArgs(monto, enganche, tasa, plazos);
            var context = new ToolExecutionContext { Channel = "Copilot", TriggerMessage = "test" };

            // Act
            var result = await _handler.ExecuteAsync(args, context);

            // Assert
            Assert.Contains("Error: No se especificó un monto válido", result);
        }

        [Fact]
        public async Task ExecuteAsync_RetornaError_CuandoEngancheEsNegativo()
        {
            // Arrange
            var args = CreateJsonArgs(100000, -1000, 10, new int[] { 120 });
            var context = new ToolExecutionContext { Channel = "Copilot", TriggerMessage = "test" };

            // Act
            var result = await _handler.ExecuteAsync(args, context);

            // Assert
            Assert.Contains("Error: El enganche no puede ser negativo", result);
        }

        [Theory]
        [InlineData(100000, 20000, 0, new int[] { 120 })]
        [InlineData(100000, 20000, -5, new int[] { 120 })]
        [InlineData(100000, 20000, 26, new int[] { 120 })]
        public async Task ExecuteAsync_RetornaError_CuandoTasaInteresAnualEsInvalida(decimal monto, decimal enganche, decimal tasa, int[] plazos)
        {
            // Arrange
            var args = CreateJsonArgs(monto, enganche, tasa, plazos);
            var context = new ToolExecutionContext { Channel = "Copilot", TriggerMessage = "test" };

            // Act
            var result = await _handler.ExecuteAsync(args, context);

            // Assert
            Assert.Contains("Error Crítico: La tasa de interés provista por el RAG es irreal", result);
        }

        [Fact]
        public async Task ExecuteAsync_RetornaError_CuandoPlazosSonInvalidosOVacios()
        {
            // Arrange
            var args = CreateJsonArgs(100000, 20000, 10, Array.Empty<int>());
            var context = new ToolExecutionContext { Channel = "Copilot", TriggerMessage = "test" };

            // Act
            var result = await _handler.ExecuteAsync(args, context);

            // Assert
            Assert.Contains("Error: No se proporcionaron plazos válidos", result);
        }

        [Fact]
        public async Task ExecuteAsync_RetornaError_CuandoMontoPrestamoInvalido()
        {
            // Arrange
            var args = CreateJsonArgs(100000, 100000, 10, new int[] { 120 });
            var context = new ToolExecutionContext { Channel = "Copilot", TriggerMessage = "test" };

            // Act
            var result = await _handler.ExecuteAsync(args, context);

            // Assert
            Assert.Contains("Error: El monto de préstamo calculado es inválido", result);
        }

        [Fact]
        public async Task ExecuteAsync_RetornaCalculoExitoso_ConAvisoLegal()
        {
            // Arrange
            // Préstamo de 80,000, tasa 12% anual (1% mensual), 120 meses.
            var args = CreateJsonArgs(100000, 20000, 12, new int[] { 120 });
            var context = new ToolExecutionContext { Channel = "Copilot", TriggerMessage = "test" };

            // Act
            var result = await _handler.ExecuteAsync(args, context);

            // Assert
            Assert.Contains("TasaInteresAplicada\":12", result);
            Assert.Contains("Meses\":120", result);
            Assert.Contains("Aviso Legal", result);

            // Fórmula: Pago = P * (r(1+r)^n) / ((1+r)^n - 1)
            // r = 0.01, P = 80000, n = 120
            // Pago = 80000 * (0.01 * (1.01^120)) / ((1.01^120) - 1) = 80000 * (0.01 * 3.30038) / 2.30038 = 1147.75 aprox
            
            // Verificamos que el pago calculado sea el correcto extrayendo el objeto o verificando string (1147.75)
            // Deserialize para hacerlo limpio
            var jsonPart = result.Substring(0, result.IndexOf("\n\nINSTRUCCIÓN CRÍTICA"));
            var response = JsonSerializer.Deserialize<CotizacionResponse>(jsonPart, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            Assert.NotNull(response);
            Assert.Equal(12m, response.TasaInteresAplicada);
            Assert.Single(response.Proyecciones);
            Assert.Equal(120, response.Proyecciones[0].Meses);

            // Tolerancia de centavos
            Assert.InRange(response.Proyecciones[0].PagoMensual, 1147.76m, 1147.78m);
        }
    }
}
