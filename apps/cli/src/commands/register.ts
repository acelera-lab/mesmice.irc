import { loadConfig, saveConfig } from '@mesmice/common';
import { promptAll } from '../prompt.js';
import { postRegister } from '../api.js';

export async function registerCommand(
  host?: string,
  options: { port?: string } = {},
): Promise<void> {
  const config = loadConfig();
  const httpPort = options.port ? parseInt(options.port, 10) : undefined;
  const server = host || config.server;

  if (!server) {
    console.log(
      'No server configured. Use "mesmice connect <host>" or "mesmice register <host>" first.',
    );
    return;
  }

  const { answers } = await promptAll(['Username', 'Password (min 8 chars)', 'Nickname']);
  const username = answers[0];
  const password = answers[1];
  const nickname = answers[2];

  if (!username || !password || !nickname) {
    console.log('Aborted.');
    return;
  }

  if (password.length < 8) {
    console.error('Password must be at least 8 characters.');
    return;
  }

  try {
    const { response, data } = await postRegister(server, httpPort, {
      username,
      password,
      nickname,
    });
    if (response.ok) {
      saveConfig({ server, nickname: data.nickname || nickname });
      console.log('Registration successful!');
      console.log(`Nickname: ${data.nickname}`);
      console.log('You can now login with "mesmice connect" or "mesmice login".');
    } else {
      console.error('Registration failed:', data.error);
    }
  } catch (err) {
    console.error('Registration failed: could not reach server.', (err as Error).message);
    console.log('Make sure the server is running. If it uses a custom port, pass it with --port.');
  }
}
