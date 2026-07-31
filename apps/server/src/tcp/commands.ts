import type { ShadowServer, ConnectionState } from '../server.js';
import type { ProtocolPacket } from '@mesmice/common';
import { createPacket, getHelpText } from '@mesmice/protocol';
import { getDatabase } from '@mesmice/database';
import { handleAsk, handleAI } from './ai.js';

type SendFn = (p: ProtocolPacket) => void;

export async function handleCommand(
  server: ShadowServer,
  connectionId: string,
  packet: ProtocolPacket,
  send: SendFn,
): Promise<void> {
  const payload = packet.payload as {
    command: string;
    args: string[];
    token: string;
  };

  if (!payload.command) {
    send(createPacket('command_response', { error: 'Command required' }));
    return;
  }

  const conn = server.getConnection(connectionId);
  if (!conn) {
    send(createPacket('command_response', { error: 'Not connected' }));
    return;
  }

  const cmd = payload.command.toLowerCase();
  const args = payload.args || [];

  try {
    switch (cmd) {
      case 'join':
        await handleJoin(server, connectionId, conn, args, send);
        break;
      case 'msg':
        await handleMsg(conn, args, send);
        break;
      case 'me':
        await handleMe(conn, args, send);
        break;
      case 'list':
        await handleList(send);
        break;
      case 'leave':
        await handleLeave(server, connectionId, conn, args, send);
        break;
      case 'nick':
        await handleNick(conn, args, send);
        break;
      case 'help':
        send(createPacket('command_response', { output: getHelpText(args[0]) }));
        break;
      case 'who':
        await handleWho(conn, args, send);
        break;
      case 'whois':
        await handleWhois(args, send);
        break;
      case 'topic':
        await handleTopic(conn, args, send);
        break;
      case 'create':
        await handleCreate(server, connectionId, conn, args, send);
        break;
      case 'invite':
        await handleInvite(conn, args, send);
        break;
      case 'ask':
        await handleAsk(conn, args, send);
        break;
      case 'ai':
        await handleAI(args, send);
        break;
      default:
        send(
          createPacket('command_response', {
            error: `Unknown command: ${cmd}. Type /help for available commands.`,
          }),
        );
    }
  } catch (err) {
    console.error(`[Command] Error executing '${cmd}':`, err);
    send(createPacket('command_response', { error: 'Internal error executing command' }));
  }
}

async function handleJoin(
  server: ShadowServer,
  connectionId: string,
  conn: ConnectionState,
  args: string[],
  send: SendFn,
): Promise<void> {
  if (args.length < 1) {
    send(createPacket('command_response', { error: 'Usage: /join <channel> [password]' }));
    return;
  }

  const channelName = args[0]!.toLowerCase();
  const db = getDatabase();

  let channel = await db.channel.findUnique({ where: { name: channelName } });
  if (!channel) {
    send(
      createPacket('command_response', {
        error: `Channel #${channelName} does not exist. Use /create to create it.`,
      }),
    );
    return;
  }

  const existingMember = await db.member.findUnique({
    where: { userId_channelId: { userId: conn.userId!, channelId: channel.id } },
  });

  if (existingMember) {
    server.joinChannel(connectionId, channelName);
    conn.currentChannel = channelName;
    send(createPacket('command_response', { output: `Joined #${channelName}` }));
    return;
  }

  if (channel.type === 'password_protected') {
    if (!args[1]) {
      send(createPacket('command_response', { error: 'This channel requires a password' }));
      return;
    }
  }

  await db.member.create({
    data: {
      userId: conn.userId!,
      channelId: channel.id,
      role: 'member',
    },
  });

  server.joinChannel(connectionId, channelName);
  conn.currentChannel = channelName;

  send(createPacket('command_response', { output: `Joined #${channelName}` }));
}

async function handleMsg(conn: ConnectionState, args: string[], send: SendFn): Promise<void> {
  if (args.length < 2) {
    send(createPacket('command_response', { error: 'Usage: /msg <channel|user> <message>' }));
    return;
  }

  const target = args[0]!;
  const message = args.slice(1).join(' ');

  const db = getDatabase();

  if (target.startsWith('#')) {
    const channelName = target.slice(1).toLowerCase();
    const channel = await db.channel.findUnique({ where: { name: channelName } });
    if (!channel) {
      send(createPacket('command_response', { error: `Channel ${target} not found` }));
      return;
    }

    const msg = await db.message.create({
      data: {
        channelId: channel.id,
        senderId: conn.userId!,
        content: message,
        type: 'text',
      },
    });

    send(
      createPacket('message', {
        channel: target,
        sender: conn.nickname,
        content: message,
        id: msg.id,
        timestamp: msg.createdAt,
      }),
    );
  } else {
    // Private message
    const recipient = await db.user.findUnique({ where: { nickname: target } });
    if (!recipient) {
      send(createPacket('command_response', { error: `User ${target} not found` }));
      return;
    }

    send(
      createPacket('message', {
        type: 'private',
        recipient: target,
        sender: conn.nickname,
        content: message,
        encrypted: true,
      }),
    );
  }
}

async function handleMe(conn: ConnectionState, args: string[], send: SendFn): Promise<void> {
  if (args.length < 1) {
    send(createPacket('command_response', { error: 'Usage: /me <action>' }));
    return;
  }

  const action = args.join(' ');
  send(
    createPacket('message', {
      type: 'action',
      sender: conn.nickname,
      content: action,
      channel: conn.currentChannel ? `#${conn.currentChannel}` : null,
    }),
  );
}

async function handleList(send: SendFn): Promise<void> {
  const db = getDatabase();
  const channels = await db.channel.findMany({
    select: {
      name: true,
      type: true,
      topic: true,
      _count: { select: { members: true } },
    },
  });

  const lines = channels.map(
    (c) => `  #${c.name.padEnd(20)} ${c.type.padEnd(18)} ${c._count.members} members`,
  );

  send(
    createPacket('command_response', {
      output: `Channels:\n${lines.join('\n')}`,
    }),
  );
}

async function handleLeave(
  server: ShadowServer,
  connectionId: string,
  conn: ConnectionState,
  args: string[],
  send: SendFn,
): Promise<void> {
  const channelName = args[0] || conn.currentChannel;
  if (!channelName) {
    send(createPacket('command_response', { error: 'Not in any channel' }));
    return;
  }

  const db = getDatabase();
  const channel = await db.channel.findUnique({ where: { name: channelName.toLowerCase() } });
  if (channel) {
    await db.member.deleteMany({
      where: { userId: conn.userId!, channelId: channel.id },
    });
  }

  server.leaveChannel(connectionId, channelName.toLowerCase());
  send(createPacket('command_response', { output: `Left #${channelName}` }));
}

async function handleNick(conn: ConnectionState, args: string[], send: SendFn): Promise<void> {
  if (args.length < 1) {
    send(createPacket('command_response', { error: 'Usage: /nick <new_nickname>' }));
    return;
  }

  const newNick = args[0]!;
  const db = getDatabase();

  const existing = await db.user.findUnique({ where: { nickname: newNick } });
  if (existing && existing.id !== conn.userId) {
    send(createPacket('command_response', { error: 'Nickname already taken' }));
    return;
  }

  await db.user.update({
    where: { id: conn.userId! },
    data: { nickname: newNick },
  });

  conn.nickname = newNick;
  send(createPacket('command_response', { output: `You are now known as ${newNick}` }));
}

async function handleWho(conn: ConnectionState, args: string[], send: SendFn): Promise<void> {
  const channelName = args[0] || conn.currentChannel;
  if (!channelName) {
    send(createPacket('command_response', { error: 'Not in any channel' }));
    return;
  }

  const db = getDatabase();
  const channel = await db.channel.findUnique({
    where: { name: channelName.toLowerCase() },
    include: {
      members: {
        include: { user: { select: { nickname: true, bio: true } } },
      },
    },
  });

  if (!channel) {
    send(createPacket('command_response', { error: 'Channel not found' }));
    return;
  }

  const lines = channel.members.map((m) => `  ${m.user.nickname}`);
  send(
    createPacket('command_response', {
      output: `Users in #${channelName} (${channel.members.length}):\n${lines.join('\n')}`,
    }),
  );
}

async function handleWhois(args: string[], send: SendFn): Promise<void> {
  if (args.length < 1) {
    send(createPacket('command_response', { error: 'Usage: /whois <user>' }));
    return;
  }

  const db = getDatabase();
  const user = await db.user.findUnique({
    where: { nickname: args[0] },
    select: { username: true, nickname: true, bio: true, publicKey: true, createdAt: true },
  });

  if (!user) {
    send(createPacket('command_response', { error: 'User not found' }));
    return;
  }

  send(
    createPacket('command_response', {
      output: [
        `User: ${user.nickname}`,
        `Username: ${user.username}`,
        `Bio: ${user.bio || 'Not set'}`,
        `Public Key: ${user.publicKey.slice(0, 32)}...`,
        `Registered: ${user.createdAt.toISOString()}`,
      ].join('\n'),
    }),
  );
}

async function handleTopic(conn: ConnectionState, args: string[], send: SendFn): Promise<void> {
  let channelName = conn.currentChannel;
  let topicArgs = args;

  const firstArg = args[0];
  if (firstArg && firstArg.startsWith('#')) {
    channelName = firstArg.slice(1).toLowerCase();
    topicArgs = args.slice(1);
  }

  if (!channelName) {
    send(createPacket('command_response', { error: 'Not in any channel' }));
    return;
  }

  const db = getDatabase();
  const channel = await db.channel.findUnique({ where: { name: channelName.toLowerCase() } });
  if (!channel) {
    send(createPacket('command_response', { error: 'Channel not found' }));
    return;
  }

  if (topicArgs.length === 0) {
    send(
      createPacket('command_response', {
        output: `Topic for #${channelName}: ${channel.topic || 'No topic set'}`,
      }),
    );
    return;
  }

  const newTopic = topicArgs.join(' ');
  await db.channel.update({
    where: { id: channel.id },
    data: { topic: newTopic },
  });

  send(createPacket('command_response', { output: `Topic changed to: ${newTopic}` }));
}

async function handleCreate(
  server: ShadowServer,
  connectionId: string,
  conn: ConnectionState,
  args: string[],
  send: SendFn,
): Promise<void> {
  if (args.length < 1) {
    send(createPacket('command_response', { error: 'Usage: /create <name> [type] [password]' }));
    return;
  }

  const name = args[0]!.toLowerCase();
  const type = args[1] || 'public';
  const password = args[2];

  if (!['public', 'private', 'password_protected'].includes(type)) {
    send(
      createPacket('command_response', {
        error: 'Invalid channel type. Use: public, private, or password_protected',
      }),
    );
    return;
  }

  const db = getDatabase();

  const existing = await db.channel.findUnique({ where: { name } });
  if (existing) {
    send(createPacket('command_response', { error: `Channel #${name} already exists` }));
    return;
  }

  const channel = await db.channel.create({
    data: {
      name,
      type,
      passwordHash: password || null,
      ownerId: conn.userId!,
    },
  });

  await db.member.create({
    data: {
      userId: conn.userId!,
      channelId: channel.id,
      role: 'owner',
    },
  });

  server.joinChannel(connectionId, name);
  conn.currentChannel = name;

  send(createPacket('command_response', { output: `Created and joined #${name}` }));
}

async function handleInvite(conn: ConnectionState, args: string[], send: SendFn): Promise<void> {
  if (args.length < 2) {
    send(createPacket('command_response', { error: 'Usage: /invite <user> <channel>' }));
    return;
  }

  const nickname = args[0]!;
  const channelName = args[1]!.toLowerCase();

  const db = getDatabase();
  const channel = await db.channel.findUnique({ where: { name: channelName } });
  if (!channel) {
    send(createPacket('command_response', { error: `Channel #${channelName} not found` }));
    return;
  }

  const user = await db.user.findUnique({ where: { nickname } });
  if (!user) {
    send(createPacket('command_response', { error: `User ${nickname} not found` }));
    return;
  }

  const existingMember = await db.member.findUnique({
    where: { userId_channelId: { userId: user.id, channelId: channel.id } },
  });

  if (existingMember) {
    send(createPacket('command_response', { error: `${nickname} is already in #${channelName}` }));
    return;
  }

  await db.invite.create({
    data: {
      channelId: channel.id,
      inviterId: conn.userId!,
      inviteeId: user.id,
      maxUses: 1,
    },
  });

  send(
    createPacket('command_response', {
      output: `Invited ${nickname} to #${channelName}`,
    }),
  );
}
