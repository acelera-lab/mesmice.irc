import { ShadowClient } from '@mesmice/sdk';
import { loadConfig } from '@mesmice/common';
import { promptAll } from '../prompt.js';

export async function loginCommand(): Promise<void> {
  const config = loadConfig();

  if (!config.server) {
    console.log('No server configured. Use "mesmice connect <host>" first.');
    return;
  }

  const { answers } = await promptAll(['Username', 'Password']);
  const username = answers[0];
  const password = answers[1];

  if (!username || !password) {
    console.log('Aborted.');
    return;
  }

  const client = new ShadowClient({
    host: config.server,
    port: config.port !== undefined ? Number(config.port) : undefined,
  });

  try {
    await client.connect();
    await client.authenticate({ username, password });
    console.log('Login successful!');
    console.log('Use "mesmice connect <host>" to start chatting.');
    await client.disconnect();
  } catch (err) {
    console.error('Login failed:', (err as Error).message);
  }
}
