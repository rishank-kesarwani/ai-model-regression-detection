import { ModelPricing } from '../types/evaluation.types';

export const DEFAULT_MODEL_PRICING_CATALOG: ModelPricing[] = [
  {
    provider: 'openai',
    model: 'gpt-4o',
    inputTokenCostPerMillion: 2.5,
    outputTokenCostPerMillion: 10.0,
    currency: 'USD',
  },
  {
    provider: 'openai',
    model: 'gpt-4o-mini',
    inputTokenCostPerMillion: 0.15,
    outputTokenCostPerMillion: 0.6,
    currency: 'USD',
  },
  {
    provider: 'anthropic',
    model: 'claude-3-5-sonnet',
    inputTokenCostPerMillion: 3.0,
    outputTokenCostPerMillion: 15.0,
    currency: 'USD',
  },
  {
    provider: 'anthropic',
    model: 'claude-3-5-haiku',
    inputTokenCostPerMillion: 0.8,
    outputTokenCostPerMillion: 4.0,
    currency: 'USD',
  },
  {
    provider: 'google',
    model: 'gemini-1.5-pro',
    inputTokenCostPerMillion: 1.25,
    outputTokenCostPerMillion: 5.0,
    currency: 'USD',
  },
  {
    provider: 'google',
    model: 'gemini-1.5-flash',
    inputTokenCostPerMillion: 0.075,
    outputTokenCostPerMillion: 0.3,
    currency: 'USD',
  },
  {
    provider: 'deepseek',
    model: 'deepseek-v3',
    inputTokenCostPerMillion: 0.14,
    outputTokenCostPerMillion: 0.28,
    currency: 'USD',
  },
  {
    provider: 'deepseek',
    model: 'deepseek-r1',
    inputTokenCostPerMillion: 0.55,
    outputTokenCostPerMillion: 2.19,
    currency: 'USD',
  },
  {
    provider: 'meta',
    model: 'llama-3.3-70b',
    inputTokenCostPerMillion: 0.59,
    outputTokenCostPerMillion: 0.79,
    currency: 'USD',
  },
];

export class PricingCalculator {
  private customPricing: Map<string, ModelPricing> = new Map();

  constructor(customList?: ModelPricing[]) {
    this.registerDefaults();
    if (customList) {
      for (const p of customList) {
        this.registerPricing(p);
      }
    }
  }

  private getKey(provider: string, model: string): string {
    return `${provider.toLowerCase()}:${model.toLowerCase()}`;
  }

  private registerDefaults() {
    for (const p of DEFAULT_MODEL_PRICING_CATALOG) {
      this.registerPricing(p);
    }
  }

  public registerPricing(pricing: ModelPricing): void {
    this.customPricing.set(this.getKey(pricing.provider, pricing.model), pricing);
  }

  public getPricing(provider: string, model: string): ModelPricing | undefined {
    // Exact match
    const exact = this.customPricing.get(this.getKey(provider, model));
    if (exact) return exact;

    // Substring match
    const lowerModel = model.toLowerCase();
    for (const [key, p] of this.customPricing.entries()) {
      if (key.startsWith(`${provider.toLowerCase()}:`) && lowerModel.includes(p.model.toLowerCase())) {
        return p;
      }
    }

    // Default generic fallback
    return {
      provider,
      model,
      inputTokenCostPerMillion: 2.0,
      outputTokenCostPerMillion: 8.0,
      currency: 'USD',
    };
  }

  public calculateCost(
    provider: string,
    model: string,
    promptTokens: number,
    completionTokens: number,
  ): number {
    const pricing = this.getPricing(provider, model);
    if (!pricing) return 0;

    const inputCost = (promptTokens / 1_000_000) * pricing.inputTokenCostPerMillion;
    const outputCost = (completionTokens / 1_000_000) * pricing.outputTokenCostPerMillion;
    return Math.round((inputCost + outputCost) * 1_000_000) / 1_000_000;
  }
}
