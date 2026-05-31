using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Text.Json;
using Microsoft.Extensions.AI;

namespace CRM_Inmobiliario.Api.Features.WhatsApp.Services;

public static class AiPromptConstants
{
    public static readonly ImmutableArray<ChatMessage> GoldenExamples = ImmutableArray.Create<ChatMessage>(
        // Example 1: Búsqueda de Propiedades
        new ChatMessage(ChatRole.User, "Hola, busco un departamento en alquiler por Cumbayá, que tenga al menos 2 habitaciones y no pase de los 800 dólares."),
        new ChatMessage(ChatRole.Assistant, "") { Contents = { new FunctionCallContent("call_abc123", "BuscarPropiedades", JsonSerializer.Deserialize<IDictionary<string, object?>>("{\"query\":\"Cumbayá\",\"tipoOperacion\":\"Alquiler\",\"presupuestoMaximo\":800,\"habitacionesMinimas\":2}")) } },
        new ChatMessage(ChatRole.Tool, "[1: Depto Cumbayá Centro, $750, 2 habs, 2 baños, 1 parqueo. 2: Suite Cumbayá, $600, 2 habs, 1 baño.]") { Contents = { new FunctionResultContent("call_abc123", "[1: Depto Cumbayá Centro, $750, 2 habs, 2 baños, 1 parqueo. 2: Suite Cumbayá, $600, 2 habs, 1 baño.]") } },
        new ChatMessage(ChatRole.Assistant, "*Hola*, con gusto te muestro algunas opciones excelentes en Cumbayá que se ajustan a tu presupuesto y necesidades:\n\nDEPARTAMENTO MODERNO EN CUMBAYÁ CENTRO\n- 💰 *Precio:* $750\n- 📍 *Ubicación:* Cumbayá, Quito\n- 📋 *Operación:* Alquiler\n- 🛏️ *Habitaciones:* 2\n- 🚿 *Baños:* 2\n- 🚗 *Parqueos:* 1\n[Ver más detalles aquí](URL)\n\nDEPARTAMENTO ACOGEDOR CERCA DEL PARQUE\n- 💰 *Precio:* $600\n- 📍 *Ubicación:* Cumbayá, Quito\n- 📋 *Operación:* Alquiler\n- 🛏️ *Habitaciones:* 2\n- 🚿 *Baños:* 1\n[Ver más detalles aquí](URL)\n\nAvísame si alguna te llama la atención para coordinar una visita."),

        // Example 2: Detalles de Propiedad
        new ChatMessage(ChatRole.User, "Me interesa la Casa en Cumbayá (ID: prop-123). ¿Me puedes decir de cuánto es la alícuota y si aceptan mascotas?"),
        new ChatMessage(ChatRole.Assistant, "") { Contents = { new FunctionCallContent("call_abc124", "ConsultarDetallesPropiedad", JsonSerializer.Deserialize<IDictionary<string, object?>>("{\"propiedadId\":\"prop-123\"}")) } },
        new ChatMessage(ChatRole.Tool, "Alícuota: $150, Mascotas: Sí, permitidas, Antigüedad: 2 años") { Contents = { new FunctionResultContent("call_abc124", "Alícuota: $150, Mascotas: Sí, permitidas, Antigüedad: 2 años") } },
        new ChatMessage(ChatRole.Assistant, "*¡Hola!* Te confirmo que en esta casa *sí* se aceptan mascotas. Además, el valor de la alícuota mensual es de *$150*. ¿Te gustaría que coordinemos una visita para que la conozcas?"),

        // Example 3: Registro de Interés
        new ChatMessage(ChatRole.User, "Me encantó la suite de La Carolina (ID: prop-111). ¿Podemos ir a verla mañana por la tarde?"),
        new ChatMessage(ChatRole.Assistant, "") { Contents = { new FunctionCallContent("call_abc125", "RegistrarInteresContacto", JsonSerializer.Deserialize<IDictionary<string, object?>>("{\"propiedadId\":\"prop-111\",\"nivelInteres\":\"Alto\"}")) } },
        new ChatMessage(ChatRole.Tool, "Interés registrado exitosamente") { Contents = { new FunctionResultContent("call_abc125", "Interés registrado exitosamente") } },
        new ChatMessage(ChatRole.Assistant, "*¡Excelente!* Mañana por la tarde es un momento ideal. Permíteme confirmarlo con el propietario para agendar la visita formalmente. ¿Prefieres a las 3:00 PM o a las 4:00 PM?"),

        // Example 4: Base de Conocimiento
        new ChatMessage(ChatRole.User, "Hola, ¿ustedes cobran comisión al comprador o al vendedor?"),
        new ChatMessage(ChatRole.Assistant, "") { Contents = { new FunctionCallContent("call_abc126", "ConsultarBaseConocimiento", JsonSerializer.Deserialize<IDictionary<string, object?>>("{\"query\":\"cobro de comisiones comprador vendedor\"}")) } },
        new ChatMessage(ChatRole.Tool, "Política: La comisión inmobiliaria del 5% es cubierta única y exclusivamente por el propietario vendedor. El comprador no paga comisión por la gestión.") { Contents = { new FunctionResultContent("call_abc126", "Política: La comisión inmobiliaria del 5% es cubierta única y exclusivamente por el propietario vendedor. El comprador no paga comisión por la gestión.") } },
        new ChatMessage(ChatRole.Assistant, "*¡Hola!* Te confirmo que nuestra comisión por gestión inmobiliaria la cubre única y exclusivamente el *propietario vendedor*. Como comprador, tú *no pagas* ningún porcentaje de comisión por nuestro acompañamiento. ¿Hay alguna propiedad en la que te podamos ayudar a buscar?"),

        // Example 5: Registro de Contacto
        new ChatMessage(ChatRole.User, "Hola, buenas tardes. Soy Andrés. Estoy buscando una casa en Samborondón."),
        new ChatMessage(ChatRole.Assistant, "") { Contents = { new FunctionCallContent("call_abc127", "RegistrarNuevoContacto", JsonSerializer.Deserialize<IDictionary<string, object?>>("{\"nombre\":\"Andrés\"}")) } },
        new ChatMessage(ChatRole.Tool, "Contacto registrado exitosamente") { Contents = { new FunctionResultContent("call_abc127", "Contacto registrado exitosamente") } },
        new ChatMessage(ChatRole.Assistant, "*¡Buenas tardes Andrés!* Es un gusto saludarte. Samborondón es una zona espectacular para vivir. ¿Tienes en mente algún presupuesto máximo o la cantidad de habitaciones que necesitas para empezar a enviarte opciones?")
    );
}
