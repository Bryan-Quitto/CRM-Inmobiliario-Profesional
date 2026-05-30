export type AIModel = 'openai-gpt4o' | 'openai-gpt4-turbo' | 'gemini-1.5-pro' | 'gemini-1.5-flash';

export interface PricingConfig {
  inputRatePer1M: number;
  outputRatePer1M: number;
}

export const AI_PRICING: Record<AIModel, PricingConfig> = {
  'openai-gpt4o': { inputRatePer1M: 5.00, outputRatePer1M: 15.00 },
  'openai-gpt4-turbo': { inputRatePer1M: 10.00, outputRatePer1M: 30.00 },
  'gemini-1.5-pro': { inputRatePer1M: 3.50, outputRatePer1M: 10.50 },
  'gemini-1.5-flash': { inputRatePer1M: 0.35, outputRatePer1M: 1.05 }
};
