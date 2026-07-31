import type { ConnectionState } from '../server.js';
import type { ProtocolPacket } from '@mesmice/common';
import { createPacket } from '@mesmice/protocol';

type SendFn = (p: ProtocolPacket) => void;

export async function handleAsk(
  conn: ConnectionState,
  args: string[],
  send: SendFn,
): Promise<void> {
  if (args.length < 1) {
    send(createPacket('command_response', { error: 'Usage: /ask <question>' }));
    return;
  }

  const question = args.join(' ');
  const apiKey = process.env['OPENROUTER_API_KEY'];

  if (!apiKey) {
    send(
      createPacket('command_response', {
        error: 'AI not configured. Server admin must set OPENROUTER_API_KEY.',
      }),
    );
    return;
  }

  send(
    createPacket('command_response', {
      output: '🤔 Thinking...',
    }),
  );

  try {
    const { OpenRouterClient } = await import('@mesmice/ai');
    const ai = new OpenRouterClient({ apiKey });
    const answer = await ai.ask(question, {
      sender: conn.nickname || undefined,
    });

    send(
      createPacket('command_response', {
        output: `🤖 AI: ${answer}`,
      }),
    );
  } catch (err) {
    send(
      createPacket('command_response', {
        error: `AI Error: ${(err as Error).message}`,
      }),
    );
  }
}

export async function handleAI(args: string[], send: SendFn): Promise<void> {
  if (args.length < 1) {
    send(
      createPacket('command_response', {
        output:
          '🤖 AI Commands:\n  /ask <question> - Ask AI a question\n  /ai model <name> - Set AI model\n  /ai key <key> - Set API key (temporary)',
      }),
    );
    return;
  }

  const subcmd = args[0]!.toLowerCase();

  if (subcmd === 'model' && args[1]) {
    process.env['OPENROUTER_MODEL'] = args[1];
    send(createPacket('command_response', { output: `AI model set to: ${args[1]}` }));
  } else if (subcmd === 'key' && args[1]) {
    process.env['OPENROUTER_API_KEY'] = args[1];
    send(createPacket('command_response', { output: 'AI API key updated for this session.' }));
  } else {
    send(
      createPacket('command_response', {
        output:
          '🤖 AI is ' + (process.env['OPENROUTER_API_KEY'] ? 'configured ✅' : 'not configured ❌'),
      }),
    );
  }
}
