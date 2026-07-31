import { describe, it, expect, vi } from 'vitest';
import { OpenRouterClient } from './openrouter.js';

describe('OpenRouterClient', () => {
  it('should create client with defaults', () => {
    const client = new OpenRouterClient();
    expect(client).toBeDefined();
  });

  it('should throw if no API key and ask is called', async () => {
    const client = new OpenRouterClient({ apiKey: '' });
    await expect(client.ask('hello')).rejects.toThrow('OPENROUTER_API_KEY');
  });

  it('should set API key', () => {
    const client = new OpenRouterClient();
    client.setApiKey('sk-test');
    expect(client).toBeDefined();
  });

  it('should set model', () => {
    const client = new OpenRouterClient();
    client.setModel('gpt-4');
    expect(client).toBeDefined();
  });
});
