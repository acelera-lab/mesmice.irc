#!/usr/bin/env node
import { Command } from 'commander';
import { MESMICE_VERSION } from '@mesmice/common';
import { connectCommand } from './commands/connect.js';
import { loginCommand } from './commands/login.js';
import { registerCommand } from './commands/register.js';
import { configCommand } from './commands/config.js';
import { keysCommand } from './commands/keys.js';
import { doctorCommand } from './commands/doctor.js';

const program = new Command();

program.name('mesmice').description('Mesmice.IRC - Secure, private chat').version(MESMICE_VERSION);

program
  .command('connect')
  .description('Connect to a Mesmice server')
  .argument('<host>', 'Server address')
  .option('-p, --port <port>', 'Port number (omit for default 80)')
  .action(connectCommand);

program.command('login').description('Login to Mesmice server').action(loginCommand);

program
  .command('register')
  .description('Register a new account')
  .argument('[host]', 'Server address (uses config if omitted)')
  .option('-p, --port <port>', 'HTTP API port (omit for default 80)')
  .action(registerCommand);

program
  .command('disconnect')
  .description('Disconnect from current server')
  .action(() => {
    console.log('Disconnected.');
    process.exit(0);
  });

program
  .command('config')
  .description('View or edit configuration')
  .argument('[key]', 'Config key')
  .argument('[value]', 'Config value')
  .action(configCommand);

program
  .command('keys')
  .description('Manage cryptographic keys')
  .option('--export', 'Export public key')
  .option('--import <file>', 'Import key from file')
  .action(keysCommand);

program.command('doctor').description('Check system dependencies').action(doctorCommand);

program
  .command('version')
  .description('Show version')
  .action(() => {
    console.log(`Mesmice.IRC v${MESMICE_VERSION}`);
  });

program
  .command('help')
  .description('Show help for all commands')
  .argument('[command]', 'Show help for a specific command')
  .action((cmd?: string) => {
    if (cmd) {
      const found = program.commands.find((c) => c.name() === cmd);
      if (found) {
        found.help();
        return;
      }
      console.error(`Unknown command: ${cmd}`);
      process.exit(1);
    }
    showHelp();
  });

program.parse(process.argv);

function showHelp(): void {
  console.log(`
  ███╗   ███╗███████╗███████╗███╗   ███╗██╗ ██████╗███████╗
  ████╗ ████║██╔════╝██╔════╝████╗ ████║██║██╔════╝██╔════╝
  ██╔████╔██║█████╗  ███████╗██╔████╔██║██║██║     █████╗
  ██║╚██╔╝██║██╔══╝  ╚════██║██║╚██╔╝██║██║██║     ██╔══╝
  ██║ ╚═╝ ██║███████╗███████║██║ ╚═╝ ██║██║╚██████╗███████╗
  ╚═╝     ╚═╝╚══════╝╚══════╝╚═╝     ╚═╝╚═╝ ╚═════╝╚══════╝
  v${MESMICE_VERSION}

  Usage: mesmice <command> [options]

  Commands:
    connect <host>      Connect to a Mesmice server
                        --port, -p <port>  Port (omit for default 80)
    register            Create a new account
    login               Login to the server
    disconnect          Disconnect from current server
    config [key] [val]  View or edit configuration
    keys                Manage cryptographic keys
                        --export          Export public key
                        --import <file>   Import key from file
    doctor              Check system dependencies
    version             Show version
    help [command]      Show this help or help for a command

  Examples:
    mesmice connect localhost
    mesmice connect localhost --port 5002
    mesmice register
    mesmice login
    mesmice keys --export
    mesmice doctor
`);
}
