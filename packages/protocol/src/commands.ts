export const COMMAND_DEFINITIONS: Record<
  string,
  { description: string; usage: string; minRole: string }
> = {
  join: {
    description: 'Join a channel',
    usage: '/join <channel> [password]',
    minRole: 'member',
  },
  msg: {
    description: 'Send a private message',
    usage: '/msg <user> <message>',
    minRole: 'member',
  },
  me: {
    description: 'Send an action message',
    usage: '/me <action>',
    minRole: 'member',
  },
  list: {
    description: 'List channels',
    usage: '/list',
    minRole: 'guest',
  },
  leave: {
    description: 'Leave current channel',
    usage: '/leave',
    minRole: 'member',
  },
  ban: {
    description: 'Ban a user from the channel',
    usage: '/ban <user>',
    minRole: 'moderator',
  },
  kick: {
    description: 'Kick a user from the channel',
    usage: '/kick <user>',
    minRole: 'moderator',
  },
  nick: {
    description: 'Change your nickname',
    usage: '/nick <new_nickname>',
    minRole: 'member',
  },
  help: {
    description: 'Show available commands',
    usage: '/help [command]',
    minRole: 'guest',
  },
  who: {
    description: 'List users in current channel',
    usage: '/who',
    minRole: 'member',
  },
  whois: {
    description: 'Get information about a user',
    usage: '/whois <user>',
    minRole: 'member',
  },
  topic: {
    description: 'Set or view channel topic',
    usage: '/topic [new_topic]',
    minRole: 'moderator',
  },
  create: {
    description: 'Create a new channel',
    usage: '/create <name> [type] [password]',
    minRole: 'member',
  },
  delete: {
    description: 'Delete a channel (owner only)',
    usage: '/delete <channel>',
    minRole: 'owner',
  },
  invite: {
    description: 'Invite a user to the channel',
    usage: '/invite <user>',
    minRole: 'moderator',
  },
};

export function getHelpText(command?: string): string {
  if (command && COMMAND_DEFINITIONS[command]) {
    const cmd = COMMAND_DEFINITIONS[command]!;
    return `${command}: ${cmd.description}\n  Usage: ${cmd.usage}\n  Required role: ${cmd.minRole}`;
  }

  const lines = ['Available commands:'];
  for (const [name, def] of Object.entries(COMMAND_DEFINITIONS)) {
    lines.push(`  /${name.padEnd(10)} ${def.description}`);
  }
  return lines.join('\n');
}
