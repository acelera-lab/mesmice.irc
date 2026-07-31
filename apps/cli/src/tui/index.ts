import blessed from 'blessed';
import type { ShadowClient } from '@mesmice/sdk';
import type { TUIComponents, TUIState } from './types.js';
import { formatMessage, addMessageToBox, addSystemMessageToBox } from './messages.js';
import { setupInput } from './input.js';

const NICK_COLORS = [
  'cyan',
  'green',
  'yellow',
  'magenta',
  'red',
  'blue',
  'bright-cyan',
  'bright-green',
  'bright-yellow',
  'bright-magenta',
];

function hashNick(nick: string): string {
  let hash = 0;
  for (let i = 0; i < nick.length; i++) {
    hash = (hash << 5) - hash + nick.charCodeAt(i);
    hash |= 0;
  }
  return NICK_COLORS[Math.abs(hash) % NICK_COLORS.length]!;
}

function resetStdinForTUI(): void {
  process.stdin.removeAllListeners('keypress');
  process.stdin.removeAllListeners('data');
  process.stdin.removeAllListeners('newListener');
  delete (process.stdin as NodeJS.ReadStream & { _keypressDecoder?: unknown })._keypressDecoder;
}

export function createTUI(client: ShadowClient): { components: TUIComponents; state: TUIState } {
  resetStdinForTUI();

  const screen = blessed.screen({
    smartCSR: true,
    title: 'Mesmice.IRC',
    cursor: { artificial: true, shape: 'line', blink: true, color: 'white' },
    fastCSR: true,
    useBCE: true,
    ignoreLocked: ['C-c'],
  });

  const state: TUIState = {
    currentChannel: 'general',
    nickname: 'user',
    server: '',
    userCount: 0,
    connected: false,
    notifications: new Map(),
  };

  const header = blessed.box({
    top: 0,
    left: 0,
    width: '100%',
    height: 1,
    content: ' Mesmice.IRC  [#general]',
    style: { bg: 'blue', fg: 'white', bold: true },
    tags: true,
  });

  const channelList = blessed.list({
    top: 1,
    left: 0,
    width: 14,
    bottom: 2,
    items: ['#general'],
    border: { type: 'line' },
    style: {
      fg: 'white',
      bg: 'black',
      selected: { bg: 'blue', fg: 'white' },
      item: { fg: 'cyan' },
    },
    keys: true,
    vi: true,
    mouse: true,
    tags: true,
  });

  const userList = blessed.list({
    top: 1,
    right: 0,
    width: 16,
    bottom: 2,
    items: [],
    border: { type: 'line' },
    style: {
      fg: 'green',
      bg: 'black',
      selected: { bg: 'blue' },
    },
    tags: true,
  });

  const messageBox = blessed.box({
    top: 1,
    left: 14,
    right: 16,
    bottom: 2,
    scrollable: true,
    alwaysScroll: true,
    scrollbar: { ch: '│', style: { bg: 'blue' } },
    style: { fg: 'white', bg: 'black' },
    tags: true,
  });

  const statusBar = blessed.box({
    bottom: 1,
    left: 0,
    width: '100%',
    height: 1,
    content: ' Disconnected ',
    style: { bg: 'black', fg: 'yellow' },
    tags: true,
  });

  const inputBar = blessed.textbox({
    bottom: 0,
    left: 0,
    width: '100%',
    height: 1,
    inputOnFocus: true,
    style: { bg: 'black', fg: 'white', focus: { bg: 'black', fg: 'white' } },
  });

  screen.append(header);
  screen.append(channelList);
  screen.append(userList);
  screen.append(messageBox);
  screen.append(statusBar);
  screen.append(inputBar);

  screen.key(['C-c'], () => {
    client.disconnect();
    process.exit(0);
  });

  screen.key(['tab'], () => {
    if (screen.focused === inputBar) {
      channelList.focus();
    } else {
      inputBar.focus();
    }
    screen.render();
  });

  const messageBoxHeight = typeof messageBox.height === 'number' ? messageBox.height : 20;

  screen.key(['pageup'], () => {
    messageBox.scroll(-Math.floor(messageBoxHeight / 2));
    screen.render();
  });

  screen.key(['pagedown'], () => {
    messageBox.scroll(Math.floor(messageBoxHeight / 2));
    screen.render();
  });

  screen.key(['C-l'], () => {
    messageBox.setContent('');
    screen.render();
  });

  const components = {
    screen,
    header,
    channelList,
    userList,
    messageBox,
    statusBar,
    inputBar,
  } as TUIComponents;

  setupInput(client, components, state);

  screen.render();

  return { components, state };
}

export function addMessage(
  components: TUIComponents,
  state: TUIState,
  sender: string,
  content: string,
): void {
  const formatted = formatMessage(sender, content, hashNick(sender));
  addMessageToBox(components.messageBox, formatted);

  if (sender !== state.nickname) {
    const notifCount = (state.notifications.get(state.currentChannel) || 0) + 1;
    state.notifications.set(state.currentChannel, notifCount);
  }

  updateHeader(components, state);
  components.screen.render();
}

export function addSystemMessage(components: TUIComponents, content: string): void {
  addSystemMessageToBox(components.messageBox, content);
  components.screen.render();
}

export function addAIMessage(components: TUIComponents, content: string): void {
  const formatted = ` {bold}{yellow-fg}🤖 AI:{/} ${content}`;
  addMessageToBox(components.messageBox, formatted);
  components.screen.render();
}

export function updateHeader(components: TUIComponents, state: TUIState): void {
  const notif = state.notifications.get(state.currentChannel);
  const notifStr = notif && notif > 0 ? ` (!${notif})` : '';
  components.header.setContent(
    ` Mesmice.IRC  [#${state.currentChannel}${notifStr}]  {bold}{white-fg}${state.nickname}{/}`,
  );
}

export function updateStatusBar(components: TUIComponents, state: TUIState): void {
  const status = state.connected ? '{green-fg}Connected{/}' : '{red-fg}Disconnected{/}';
  components.statusBar.setContent(
    ` ${status} | {cyan-fg}${state.server}{/} | Users: ${state.userCount} | Channel: #${state.currentChannel}`,
  );
}
