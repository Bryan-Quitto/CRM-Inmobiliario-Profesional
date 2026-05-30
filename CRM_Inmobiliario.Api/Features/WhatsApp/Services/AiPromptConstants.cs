using System;
using System.Collections.Immutable;
using OpenAI.Chat;

namespace CRM_Inmobiliario.Api.Features.WhatsApp.Services;

public static class AiPromptConstants
{
    public static readonly ImmutableArray<ChatMessage> GoldenExamples = ImmutableArray.Create<ChatMessage>(
        // Example 1: Búsqueda de Propiedades
        new UserChatMessage("Hola, busco un departamento en alquiler por Cumbayá, que tenga al menos 2 habitaciones y no pase de los 800 dólares."),
        new AssistantChatMessage(new[] { ChatToolCall.CreateFunctionToolCall("call_abc123", "BuscarPropiedades", BinaryData.FromString("{\"query\":\"Cumbayá\",\"tipoOperacion\":\"Alquiler\",\"presupuestoMaximo\":800,\"habitacionesMinimas\":2}")) }),
        new ToolChatMessage("call_abc123", "[1: Depto Cumbayá Centro, $750, 2 habs, 2 baños, 1 parqueo. 2: Suite Cumbayá, $600, 2 habs, 1 baño.]"),
        new AssistantChatMessage("*Hola*, con gusto te muestro algunas opciones excelentes en Cumbayá que se ajustan a tu presupuesto y necesidades:\n\nDEPARTAMENTO MODERNO EN CUMBAYÁ CENTRO\n- 💰 *Precio:* $750\n- 📍 *Ubicación:* Cumbayá, Quito\n- 📋 *Operación:* Alquiler\n- 🛏️ *Habitaciones:* 2\n- 🚿 *Baños:* 2\n- 🚗 *Parqueos:* 1\n[Ver más detalles aquí](URL)\n\nDEPARTAMENTO ACOGEDOR CERCA DEL PARQUE\n- 💰 *Precio:* $600\n- 📍 *Ubicación:* Cumbayá, Quito\n- 📋 *Operación:* Alquiler\n- 🛏️ *Habitaciones:* 2\n- 🚿 *Baños:* 1\n[Ver más detalles aquí](URL)\n\nAvísame si alguna te llama la atención para coordinar una visita."),

        // Example 2: Detalles de Propiedad
        new UserChatMessage("Me interesa la Casa en Cumbayá (ID: prop-123). ¿Me puedes decir de cuánto es la alícuota y si aceptan mascotas?"),
        new AssistantChatMessage(new[] { ChatToolCall.CreateFunctionToolCall("call_abc124", "ConsultarDetallesPropiedad", BinaryData.FromString("{\"propiedadId\":\"prop-123\"}")) }),
        new ToolChatMessage("call_abc124", "Alícuota: $150, Mascotas: Sí, permitidas, Antigüedad: 2 años"),
        new AssistantChatMessage("*¡Hola!* Te confirmo que en esta casa *sí* se aceptan mascotas. Además, el valor de la alícuota mensual es de *$150*. ¿Te gustaría que coordinemos una visita para que la conozcas?"),

        // Example 3: Registro de Interés
        new UserChatMessage("Me encantó la suite de La Carolina (ID: prop-111). ¿Podemos ir a verla mañana por la tarde?"),
        new AssistantChatMessage(new[] { ChatToolCall.CreateFunctionToolCall("call_abc125", "RegistrarInteresContacto", BinaryData.FromString("{\"propiedadId\":\"prop-111\",\"nivelInteres\":\"Alto\"}")) }),
        new ToolChatMessage("call_abc125", "Interés registrado exitosamente"),
        new AssistantChatMessage("*¡Excelente!* Mañana por la tarde es un momento ideal. Permíteme confirmarlo con el propietario para agendar la visita formalmente. ¿Prefieres a las 3:00 PM o a las 4:00 PM?"),

        // Example 4: Base de Conocimiento
        new UserChatMessage("Hola, ¿ustedes cobran comisión al comprador o al vendedor?"),
        new AssistantChatMessage(new[] { ChatToolCall.CreateFunctionToolCall("call_abc126", "ConsultarBaseConocimiento", BinaryData.FromString("{\"query\":\"cobro de comisiones comprador vendedor\"}")) }),
        new ToolChatMessage("call_abc126", "Política: La comisión inmobiliaria del 5% es cubierta única y exclusivamente por el propietario vendedor. El comprador no paga comisión por la gestión."),
        new AssistantChatMessage("*¡Hola!* Te confirmo que nuestra comisión por gestión inmobiliaria la cubre única y exclusivamente el *propietario vendedor*. Como comprador, tú *no pagas* ningún porcentaje de comisión por nuestro acompañamiento. ¿Hay alguna propiedad en la que te podamos ayudar a buscar?"),

        // Example 5: Registro de Contacto
        new UserChatMessage("Hola, buenas tardes. Soy Andrés. Estoy buscando una casa en Samborondón."),
        new AssistantChatMessage(new[] { ChatToolCall.CreateFunctionToolCall("call_abc127", "RegistrarNuevoContacto", BinaryData.FromString("{\"nombre\":\"Andrés\"}")) }),
        new ToolChatMessage("call_abc127", "Contacto registrado exitosamente"),
        new AssistantChatMessage("*¡Buenas tardes Andrés!* Es un gusto saludarte. Samborondón es una zona espectacular para vivir. ¿Tienes en mente algún presupuesto máximo o la cantidad de habitaciones que necesitas para empezar a enviarte opciones?")
    );
}
