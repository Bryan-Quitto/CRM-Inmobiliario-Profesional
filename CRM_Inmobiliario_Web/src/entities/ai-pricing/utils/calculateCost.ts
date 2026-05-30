import { AIModel, AI_PRICING } from '../config';

export interface CostEstimate {
  tokens: number;
  estimatedCost: number;
}

// Lightweight heuristic: 1 token ≈ 4 characters
export const estimateTokens = (text: string): number => {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
};

export const calculateMessageCost = (text: string, model: AIModel, isInput: boolean): CostEstimate => {
  const tokens = estimateTokens(text);
  const pricing = AI_PRICING[model];
  
  if (!pricing) {
    return { tokens, estimatedCost: 0 };
  }

  const ratePer1M = isInput ? pricing.inputRatePer1M : pricing.outputRatePer1M;
  const estimatedCost = (tokens / 1_000_000) * ratePer1M;

  return { tokens, estimatedCost };
};
