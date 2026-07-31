import type {
  OpenRouterConfig,
  OpenRouterMessage,
  OpenRouterRequest,
  OpenRouterResponse,
  AICommandOptions,
} from './types.js';

const DEFAULT_CONFIG: OpenRouterConfig = {
  apiKey: process.env['OPENROUTER_API_KEY'] || '',
  model: 'mistralai/mistral-7b-instruct',
  systemPrompt:
    'You are a helpful assistant in a chat room. Be concise and friendly. Keep responses under 500 characters.',
  maxTokens: 500,
  temperature: 0.7,
};

export class OpenRouterClient {
  private config: OpenRouterConfig;
  private baseUrl = 'https://openrouter.ai/api/v1';

  constructor(config?: Partial<OpenRouterConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  setApiKey(key: string): void {
    this.config.apiKey = key;
  }

  setModel(model: string): void {
    this.config.model = model;
  }

  async ask(prompt: string, options?: Partial<AICommandOptions>): Promise<string> {
    if (!this.config.apiKey) {
      throw new Error(
        'OPENROUTER_API_KEY not configured. Set it in .env or use /ask <key>::<prompt>',
      );
    }

    const messages: OpenRouterMessage[] = [
      { role: 'system', content: this.config.systemPrompt },
      { role: 'user', content: prompt },
    ];

    const model = options?.model || this.config.model;

    const body: OpenRouterRequest = {
      model,
      messages,
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
    };

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
          'HTTP-Referer': 'https://mesmice.irc',
          'X-Title': 'Mesmice.IRC',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
      }

      const data = (await response.json()) as OpenRouterResponse;

      if (!data.choices || data.choices.length === 0) {
        throw new Error('OpenRouter returned no choices');
      }

      return data.choices[0]!.message.content.trim();
    } catch (err) {
      if (err instanceof Error && err.message.includes('fetch')) {
        throw new Error('Network error: Could not reach OpenRouter API. Check your connection.');
      }
      throw err;
    }
  }
}
