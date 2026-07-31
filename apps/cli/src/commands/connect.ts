import { ShadowClient } from '@mesmice/sdk';
import { saveConfig } from '@mesmice/common';
import {
  createTUI,
  addMessage,
  addSystemMessage,
  addAIMessage,
  updateHeader,
  updateStatusBar,
} from '../tui/index.js';
import { formatActionMessage, addMessageToBox } from '../tui/messages.js';
import { promptAll } from '../prompt.js';
import { postRegister } from '../api.js';

async function promptCredentials(): Promise<{
  username: string;
  password: string;
  isTTY: boolean;
}> {
  const { answers, isTTY } = await promptAll(['Username', 'Password']);
  const username = answers[0] ?? '';
  const password = answers[1] ?? '';
  return { username, password, isTTY };
}

async function tryAuthenticate(
  client: ShadowClient,
  username: string,
  password: string,
): Promise<true | string> {
  try {
    await client.authenticate({ username, password });
    return true;
  } catch (err) {
    return (err as Error).message;
  }
}

function isProtocolError(message: true | string): boolean {
  return (
    message !== true &&
    (message === 'Authentication timeout' ||
      message === 'Not connected' ||
      /ECONN|Connection failed/i.test(message))
  );
}

export async function connectCommand(host: string, options: { port?: string }): Promise<void> {
  const port = options.port ? parseInt(options.port, 10) : undefined;

  saveConfig({ server: host, ...(port !== undefined ? { port } : {}) });

  console.log(`Connecting to ${host}${port !== undefined ? `:${port}` : ''}...`);

  let client = new ShadowClient({ host, port });

  try {
    await client.connect();

    let { username, password, isTTY } = await promptCredentials();
    let authenticated = await tryAuthenticate(client, username, password);

    if (isProtocolError(authenticated) && port !== undefined && (port === 5001 || port === 5002)) {
      const sibling = port === 5001 ? 5002 : 5001;
      try {
        console.log(`No protocol response on port ${port}, retrying on ${sibling}...`);
        await client.disconnect();
        client = new ShadowClient({ host, port: sibling });
        await client.connect();
        saveConfig({ server: host, port: sibling });
        authenticated = await tryAuthenticate(client, username, password);
      } catch {
        /* keep the original failure */
      }
    }

    if (authenticated !== true) {
      if (!isTTY) {
        console.error(
          'Account not found. Use "mesmice register <host>" to create an account first.',
        );
        process.exit(1);
      }
      const { answers } = await promptAll(['Account not found. Register a new account? (y/N)']);
      const answer = answers[0] ?? 'n';

      if (answer.trim().toLowerCase() === 'y') {
        if (password.length < 8) {
          console.error('Registration failed: password must be at least 8 characters.');
          process.exit(1);
        }
        const { answers: nicknameAnswers } = await promptAll(['Nickname']);
        const nickname = nicknameAnswers[0] ?? username;
        const { response, data } = await postRegister(host, port, {
          username,
          password,
          nickname,
        });
        if (!response.ok) {
          console.error('Registration failed:', data.error);
          process.exit(1);
        }
        console.log('Registration successful! Logging in...');
        authenticated = await tryAuthenticate(client, username, password);
      }

      if (authenticated !== true) {
        console.error('Authentication failed');
        process.exit(1);
      }
    }

    console.log('Connected and authenticated.\n');

    const { components, state } = createTUI(client);
    state.nickname = username;
    state.server = host;
    state.connected = true;

    updateHeader(components, state);
    updateStatusBar(components, state);

    client.on('message', (packet: any) => {
      const payload = packet.payload as { sender: string; content: string; type?: string };
      if (payload.type === 'action') {
        const line = formatActionMessage(payload.sender, payload.content);
        addMessageToBox(components.messageBox, line);
      } else if (payload.type === 'ai' || payload.sender === 'AI') {
        addAIMessage(components, payload.content);
      } else {
        addMessage(components, state, payload.sender, payload.content);
      }
      components.screen.render();
    });

    client.on('disconnect', () => {
      state.connected = false;
      updateStatusBar(components, state);
      addSystemMessage(components, 'Connection closed');
      components.screen.render();
    });

    client.on('error', (err: Error) => {
      addSystemMessage(components, `Error: ${(err as Error)?.message ?? String(err)}`);
      components.screen.render();
    });

    client.on('packet_error', (packet: any) => {
      const payload = packet.payload as { code?: string; message?: string };
      addSystemMessage(components, `Error: ${payload.message ?? payload.code ?? 'Unknown error'}`);
      components.screen.render();
    });

    client.on('command_response', (packet: any) => {
      const payload = packet.payload as {
        output?: string;
        error?: string;
        channels?: string[];
        users?: string[];
      };
      if (payload.output) {
        for (const line of payload.output.split('\n')) {
          addSystemMessage(components, line);
        }
      }
      if (payload.error) {
        addSystemMessage(components, `Error: ${payload.error}`);
      }
      components.screen.render();
    });

    client.joinChannel('general');
  } catch (err) {
    console.error('Connection failed:', (err as Error).message);
    process.exit(1);
  }
}
