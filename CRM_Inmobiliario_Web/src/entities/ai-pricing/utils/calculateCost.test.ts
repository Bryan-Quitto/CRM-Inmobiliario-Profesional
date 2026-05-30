import { describe, it, expect } from 'vitest';
import { estimateTokens, calculateMessageCost } from './calculateCost';

describe('calculateCost utilities', () => {
  describe('estimateTokens', () => {
    it('should calculate 0 tokens for empty string', () => {
      expect(estimateTokens('')).toBe(0);
    });

    it('should approximate 1 token per 4 characters', () => {
      // 12 characters -> 12 / 4 = 3 tokens
      expect(estimateTokens('Hello World!')).toBe(3);
    });

    it('should ceil token counts', () => {
      // 13 characters -> 13 / 4 = 3.25 -> ceil to 4 tokens
      expect(estimateTokens('Hello World!!')).toBe(4);
    });
  });

  describe('calculateMessageCost', () => {
    it('should correctly calculate input cost for openai-gpt4o', () => {
      // 4000 characters -> 1000 tokens. 
      // gpt-4o input rate: 5.00 per 1M -> 1000 tokens = $0.005
      const text = 'a'.repeat(4000);
      const result = calculateMessageCost(text, 'openai-gpt4o', true);
      
      expect(result.tokens).toBe(1000);
      expect(result.estimatedCost).toBe(0.005);
    });

    it('should correctly calculate output cost for gemini-1.5-pro', () => {
      // 8000 characters -> 2000 tokens.
      // gemini-1.5-pro output rate: 10.50 per 1M -> 2000 tokens = $0.021
      const text = 'a'.repeat(8000);
      const result = calculateMessageCost(text, 'gemini-1.5-pro', false);
      
      expect(result.tokens).toBe(2000);
      expect(result.estimatedCost).toBe(0.021);
    });

    it('should handle undefined models gracefully', () => {
      const text = 'test text';
      // @ts-expect-error - testing graceful fallback for invalid models
      const result = calculateMessageCost(text, 'non-existent', true);
      
      expect(result.tokens).toBe(Math.ceil(9/4)); // 3
      expect(result.estimatedCost).toBe(0);
    });
  });
});
