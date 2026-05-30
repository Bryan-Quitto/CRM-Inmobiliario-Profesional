using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;
using System.Threading.Tasks;
using Google.GenAI.Types;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace CRM_Inmobiliario.Api.Features.AI.Services;

public interface IDatasetProvider
{
    Content? GetSystemInstruction();
    List<Content> GetDatasetContents();
}

public class DatasetProvider : IDatasetProvider
{
    private readonly ILogger<DatasetProvider> _logger;
    private Content? _systemInstruction;
    private readonly List<Content> _datasetContents = new();

    public DatasetProvider(ILogger<DatasetProvider> logger, IHostEnvironment env)
    {
        _logger = logger;
        LoadDataset(env.ContentRootPath);
    }

    private void LoadDataset(string contentRootPath)
    {
        try
        {
            var filePath = Path.Combine(contentRootPath, "Resources", "Datasets", "dataset_ft_crm_aistudio.jsonl");
            if (!System.IO.File.Exists(filePath))
            {
                _logger.LogWarning("Dataset file not found at {FilePath}. Context caching will not have few-shot examples.", filePath);
                return;
            }

            var lines = System.IO.File.ReadAllLines(filePath);
            foreach (var line in lines)
            {
                if (string.IsNullOrWhiteSpace(line)) continue;

                using var doc = JsonDocument.Parse(line);
                
                // Extraer SystemInstruction (solo la primera vez)
                if (_systemInstruction == null && doc.RootElement.TryGetProperty("systemInstruction", out var sysEl))
                {
                    _systemInstruction = JsonSerializer.Deserialize<Content>(sysEl.GetRawText(), new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                }

                // Extraer contents y concatenarlos
                if (doc.RootElement.TryGetProperty("contents", out var contentsEl))
                {
                    var conversation = JsonSerializer.Deserialize<List<Content>>(contentsEl.GetRawText(), new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                    if (conversation != null)
                    {
                        _datasetContents.AddRange(conversation);
                    }
                }
            }
            _logger.LogInformation("Dataset loaded successfully. Total tokens approximated: {Count} interactions.", _datasetContents.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to load dataset for Context Caching.");
        }
    }

    public Content? GetSystemInstruction() => _systemInstruction;

    public List<Content> GetDatasetContents() => _datasetContents;
}
