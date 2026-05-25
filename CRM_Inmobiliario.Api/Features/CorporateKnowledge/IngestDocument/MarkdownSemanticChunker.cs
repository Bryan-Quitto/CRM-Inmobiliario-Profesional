using System.Text.RegularExpressions;
using Microsoft.ML.Tokenizers;

namespace CRM_Inmobiliario.Api.Features.CorporateKnowledge.IngestDocument;

public class MarkdownSemanticChunker
{
    private readonly Tokenizer _tokenizer;
    private readonly int _maxTokens;
    private readonly int _overlapTokens;

    public MarkdownSemanticChunker(int maxTokens = 500, int overlapTokens = 50)
    {
        _maxTokens = maxTokens;
        _overlapTokens = overlapTokens;
        // Dependiendo de la versión de Microsoft.ML.Tokenizers
        _tokenizer = TiktokenTokenizer.CreateForModel("text-embedding-3-small");
    }

    public List<string> Chunk(string content)
    {
        var lines = content.Split('\n');
        var chunks = new List<string>();
        
        var currentChunkLines = new List<string>();
        int currentTokens = 0;
        
        var currentHierarchy = new string?[6];
        int lastHeaderLevel = 0;

        foreach (var line in lines)
        {
            var trimmedLine = line.TrimEnd('\r', '\n');
            var tokens = _tokenizer.CountTokens(trimmedLine + "\n");
            
            var match = Regex.Match(trimmedLine, @"^(#{1,6})\s+(.*)");
            if (match.Success)
            {
                int level = match.Groups[1].Value.Length;
                string headerText = match.Groups[2].Value.Trim();
                
                for(int i = level - 1; i < 6; i++) {
                    currentHierarchy[i] = null;
                }
                currentHierarchy[level - 1] = headerText;
                lastHeaderLevel = level;
            }

            if (currentTokens + tokens > _maxTokens && currentChunkLines.Count > 0)
            {
                chunks.Add(BuildChunkText(currentChunkLines));
                
                currentChunkLines = BuildOverlapAndContext(currentChunkLines, currentHierarchy, lastHeaderLevel, out currentTokens);
            }

            currentChunkLines.Add(trimmedLine);
            currentTokens += tokens;
        }

        if (currentChunkLines.Count > 0)
        {
            chunks.Add(BuildChunkText(currentChunkLines));
        }

        return chunks;
    }

    private string BuildChunkText(List<string> lines)
    {
        return string.Join("\n", lines).Trim();
    }

    private List<string> BuildOverlapAndContext(List<string> previousLines, string?[] hierarchy, int lastHeaderLevel, out int newTokens)
    {
        var newLines = new List<string>();
        newTokens = 0;

        if (lastHeaderLevel > 0)
        {
            var contextParts = hierarchy.Where(h => !string.IsNullOrEmpty(h)).ToList();
            if (contextParts.Count > 0)
            {
                var contextHeader = $"[Contexto: {string.Join(" > ", contextParts)}]";
                newLines.Add(contextHeader);
                newLines.Add("");
                newTokens += _tokenizer.CountTokens(contextHeader + "\n\n");
            }
        }

        int overlapTokens = 0;
        var overlapLines = new List<string>();
        
        for (int i = previousLines.Count - 1; i >= 0; i--)
        {
            var lineTokens = _tokenizer.CountTokens(previousLines[i] + "\n");
            if (overlapTokens + lineTokens <= _overlapTokens)
            {
                overlapLines.Insert(0, previousLines[i]);
                overlapTokens += lineTokens;
            }
            else
            {
                break;
            }
        }

        newLines.AddRange(overlapLines);
        newTokens += overlapTokens;

        return newLines;
    }
}
