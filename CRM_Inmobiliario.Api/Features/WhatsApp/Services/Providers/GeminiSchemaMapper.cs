using System.Collections.Generic;
using System.Text.Json;
using Google.GenAI.Types;

namespace CRM_Inmobiliario.Api.Features.WhatsApp.Services.Providers;

public static class GeminiSchemaMapper
{
    public static Schema ParseSchema(string jsonSchema)
    {
        using var doc = JsonDocument.Parse(jsonSchema);
        return ParseElement(doc.RootElement);
    }

    private static Schema ParseElement(JsonElement element)
    {
        var schema = new Schema();
        
        if (element.TryGetProperty("type", out var typeProp))
        {
            string? typeStr = null;
            if (typeProp.ValueKind == JsonValueKind.Array)
            {
                foreach (var item in typeProp.EnumerateArray())
                {
                    if (item.GetString() != "null")
                    {
                        typeStr = item.GetString();
                        break;
                    }
                }
            }
            else if (typeProp.ValueKind == JsonValueKind.String)
            {
                typeStr = typeProp.GetString();
            }

            schema.Type = typeStr switch
            {
                "string" => Google.GenAI.Types.Type.String,
                "number" => Google.GenAI.Types.Type.Number,
                "integer" => Google.GenAI.Types.Type.Integer,
                "boolean" => Google.GenAI.Types.Type.Boolean,
                "array" => Google.GenAI.Types.Type.Array,
                "object" => Google.GenAI.Types.Type.Object,
                _ => Google.GenAI.Types.Type.String
            };
        }

        if (element.TryGetProperty("description", out var descProp))
        {
            schema.Description = descProp.GetString();
        }

        if (element.TryGetProperty("properties", out var propsElement) && schema.Type == Google.GenAI.Types.Type.Object)
        {
            schema.Properties = new Dictionary<string, Schema>();
            foreach (var prop in propsElement.EnumerateObject())
            {
                schema.Properties[prop.Name] = ParseElement(prop.Value);
            }
        }

        if (element.TryGetProperty("required", out var requiredElement))
        {
            schema.Required = new List<string>();
            foreach (var req in requiredElement.EnumerateArray())
            {
                schema.Required.Add(req.GetString() ?? "");
            }
        }

        if (element.TryGetProperty("enum", out var enumElement))
        {
            schema.Enum = new List<string>();
            foreach (var e in enumElement.EnumerateArray())
            {
                schema.Enum.Add(e.GetString() ?? "");
            }
        }

        return schema;
    }
}
