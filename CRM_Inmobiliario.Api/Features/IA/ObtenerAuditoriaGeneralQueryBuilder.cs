namespace CRM_Inmobiliario.Api.Features.IA;

public static class ObtenerAuditoriaGeneralQueryBuilder
{
    public static string BuildQuery(string? dbCanal, string? canal)
    {
        return @"
                WITH CombinedEvents AS (
                    SELECT 
                        l.""Id"" as ""EventId"",
                        l.""ContactoId"",
                        l.""TelefonoContacto"" as ""Telefono"",
                        COALESCE(c.""Nombre"", CASE WHEN l.""Canal"" = 'Copilot' OR l.""Canal"" = 'Personal' THEN 'Acción de Copiloto' ELSE NULL END) as ""ContactoNombre"",
                        c.""Apellido"" as ""ContactoApellido"",
                        l.""Fecha"",
                        l.""Accion"",
                        l.""DetalleJson"",
                        l.""TriggerMessage"",
                        'AiAction' as ""Source"",
                        l.""Canal"" as ""Canal"",
                        'IA' as ""SenderType""
                    FROM ""AiActionLogs"" l
                    LEFT JOIN ""Contactos"" c ON c.""Id"" = l.""ContactoId""
                    WHERE l.""Fecha"" >= @StartDate AND l.""Fecha"" <= @EndDate AND (c.""AgenteId"" = @AgenteId OR l.""TelefonoContacto"" = @AgenteIdStr)
                    " + (string.IsNullOrWhiteSpace(dbCanal) ? "" : @" AND (l.""Canal"" = @Canal OR (@Canal = 'Copilot' AND l.""Canal"" = 'Personal')) ") + @"
                    AND (l.""ContactoId"" IS NULL OR NOT EXISTS (SELECT 1 FROM ""AgentArchivedContacts"" arc WHERE arc.""AgentId"" = @AgenteId AND arc.""ContactoId"" = l.""ContactoId""))

                    UNION ALL

                    SELECT 
                        w.""Id"" as ""EventId"",
                        w.""ContactoId"",
                        w.""Telefono"" as ""Telefono"",
                        c.""Nombre"" as ""ContactoNombre"",
                        c.""Apellido"" as ""ContactoApellido"",
                        w.""Fecha"",
                        'Message' as ""Accion"",
                        w.""Contenido"" as ""DetalleJson"",
                        NULL as ""TriggerMessage"",
                        'WhatsApp' as ""Source"",
                        'WhatsApp' as ""Canal"",
                        COALESCE(w.""OrigenMensaje"", w.""Rol"") as ""SenderType""
                    FROM ""WhatsappMessages"" w
                    LEFT JOIN ""Contactos"" c ON c.""Id"" = w.""ContactoId""
                    WHERE w.""Fecha"" >= @StartDate AND w.""Fecha"" <= @EndDate AND w.""AgenteId"" = @AgenteId
                    " + (!string.IsNullOrWhiteSpace(canal) && canal != "WhatsApp" ? " AND 1=0 " : "") + @"
                    AND (w.""ContactoId"" IS NULL OR NOT EXISTS (SELECT 1 FROM ""AgentArchivedContacts"" arc WHERE arc.""AgentId"" = @AgenteId AND arc.""ContactoId"" = w.""ContactoId""))

                    UNION ALL

                    SELECT 
                        f.""Id"" as ""EventId"",
                        f.""ContactoId"",
                        f.""FacebookSenderId"" as ""Telefono"",
                        c.""Nombre"" as ""ContactoNombre"",
                        c.""Apellido"" as ""ContactoApellido"",
                        f.""Fecha"",
                        'Message' as ""Accion"",
                        f.""Contenido"" as ""DetalleJson"",
                        NULL as ""TriggerMessage"",
                        'Facebook' as ""Source"",
                        'Facebook' as ""Canal"",
                        COALESCE(f.""OrigenMensaje"", f.""Rol"") as ""SenderType""
                    FROM ""FacebookMessages"" f
                    LEFT JOIN ""Contactos"" c ON c.""Id"" = f.""ContactoId""
                    WHERE f.""Fecha"" >= @StartDate AND f.""Fecha"" <= @EndDate AND f.""AgenteId"" = @AgenteId
                    " + (!string.IsNullOrWhiteSpace(canal) && canal != "Facebook" ? " AND 1=0 " : "") + @"
                    AND (f.""ContactoId"" IS NULL OR NOT EXISTS (SELECT 1 FROM ""AgentArchivedContacts"" arc WHERE arc.""AgentId"" = @AgenteId AND arc.""ContactoId"" = f.""ContactoId""))

                    UNION ALL

                    SELECT 
                        am.""Id"" as ""EventId"",
                        NULL as ""ContactoId"",
                        CAST(ac.""Id"" AS varchar) as ""Telefono"",
                        COALESCE(ac.""Title"", 'Conversación sin título') as ""ContactoNombre"",
                        NULL as ""ContactoApellido"",
                        am.""CreatedAt"" as ""Fecha"",
                        'Message' as ""Accion"",
                        am.""Content"" as ""DetalleJson"",
                        NULL as ""TriggerMessage"",
                        'Copilot' as ""Source"",
                        'Copilot' as ""Canal"",
                        am.""Role"" as ""SenderType""
                    FROM ""AgentMessages"" am
                    INNER JOIN ""AgentConversations"" ac ON ac.""Id"" = am.""AgentConversationId""
                    WHERE am.""CreatedAt"" >= @StartDate AND am.""CreatedAt"" <= @EndDate AND ac.""AgentId"" = @AgenteId
                    " + (!string.IsNullOrWhiteSpace(dbCanal) && dbCanal != "Copilot" ? " AND 1=0 " : "") + @"
                )
                SELECT 
                    ""EventId"", 
                    ""ContactoId"", 
                    ""Telefono"", 
                    ""ContactoNombre"",
                    ""ContactoApellido"",
                    ""Fecha"", 
                    ""Accion"", 
                    ""DetalleJson"", 
                    ""TriggerMessage"", 
                    ""Source"",
                    ""Canal"",
                    ""SenderType""
                FROM CombinedEvents
                ORDER BY ""Fecha"" ASC;";
    }
}
