import type { ShadowClient } from '@mesmice/sdk';
import type { TUIComponents, TUIState } from './types.js';
import { addSystemMessage } from './index.js';

const COMMAND_HISTORY: string[] = [];
const MAX_HISTORY = 50;
let historyIndex = -1;

export function setupInput(client: ShadowClient, components: TUIComponents, state: TUIState): void {
  const { inputBar, screen } = components;

  inputBar.focus();

  inputBar.on('submit', () => {
    const value = inputBar.getValue().trim();
    inputBar.clearValue();
    inputBar.focus();

    if (!value) return;

    COMMAND_HISTORY.push(value);
    if (COMMAND_HISTORY.length > MAX_HISTORY) COMMAND_HISTORY.shift();
    historyIndex = COMMAND_HISTORY.length;

    if (value.startsWith('/')) {
      handleLocalCommand(client, components, value);
    } else {
      client.sendMessage(`#${state.currentChannel}`, value);
    }

    screen.render();
  });

  inputBar.key(['up'], () => {
    if (COMMAND_HISTORY.length === 0) return;
    historyIndex = Math.max(0, historyIndex - 1);
    inputBar.setValue(COMMAND_HISTORY[historyIndex]!);
    screen.render();
  });

  inputBar.key(['down'], () => {
    if (historyIndex >= COMMAND_HISTORY.length - 1) {
      historyIndex = COMMAND_HISTORY.length;
      inputBar.clearValue();
    } else {
      historyIndex++;
      inputBar.setValue(COMMAND_HISTORY[historyIndex]!);
    }
    screen.render();
  });
}

function handleLocalCommand(
  client: ShadowClient,
  components: TUIComponents,
  command: string,
): void {
  const parts = command.slice(1).split(' ');
  const cmd = parts[0]?.toLowerCase();
  const args = parts.slice(1);

  switch (cmd) {
    case 'clear':
      components.messageBox.setContent('');
      components.screen.render();
      break;

    case 'help':
      addSystemMessage(components, '── Commands ──────────────────────────────');
      addSystemMessage(components, '  /join <ch>        Join a channel');
      addSystemMessage(components, '  /msg <user> <txt> Private message');
      addSystemMessage(components, '  /me <action>      Action message');
      addSystemMessage(components, '  /list             List channels');
      addSystemMessage(components, '  /leave [ch]       Leave channel');
      addSystemMessage(components, '  /nick <name>      Change nickname');
      addSystemMessage(components, '  /who              Users in channel');
      addSystemMessage(components, '  /whois <user>     User info');
      addSystemMessage(components, '  /topic [txt]      View/set topic');
      addSystemMessage(components, '  /create <ch>      Create channel');
      addSystemMessage(components, '  /invite <u> <ch>  Invite user');
      addSystemMessage(components, '  /ask <q>          Ask AI');
      addSystemMessage(components, '  /ai               AI settings');
      addSystemMessage(components, '  /clear            Clear screen');
      addSystemMessage(components, '  /help             This help');
      addSystemMessage(components, '──────────────────────────────────────────');
      break;

    default:
      client.sendCommand(cmd!, args);
  }
}
