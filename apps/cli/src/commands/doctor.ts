import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { getConfigPath } from '@mesmice/common';

interface CheckResult {
  name: string;
  status: 'ok' | 'warn' | 'error';
  message: string;
}

export async function doctorCommand(): Promise<void> {
  console.log('Mesmice.IRC - System Check');
  console.log('========================\n');

  const results: CheckResult[] = [];

  results.push(checkNodeVersion());
  results.push(checkConfig());
  results.push(checkKeys());

  const errors = results.filter((r) => r.status === 'error').length;
  const warnings = results.filter((r) => r.status === 'warn').length;

  for (const result of results) {
    const icon = result.status === 'ok' ? '✓' : result.status === 'warn' ? '⚠' : '✗';
    console.log(` ${icon} ${result.name}: ${result.message}`);
  }

  console.log(`\n${results.length} checks: ${errors} errors, ${warnings} warnings`);
}

function checkNodeVersion(): CheckResult {
  const version = process.version;
  const major = parseInt(version.slice(1).split('.')[0]!, 10);
  if (major >= 22) {
    return { name: 'Node.js', status: 'ok', message: version };
  }
  return { name: 'Node.js', status: 'error', message: `${version} (need >= 22)` };
}

function checkConfig(): CheckResult {
  const path = getConfigPath();
  if (existsSync(path)) {
    return { name: 'Config', status: 'ok', message: path };
  }
  return { name: 'Config', status: 'warn', message: 'Not found (will use defaults)' };
}

function checkKeys(): CheckResult {
  const keyDir = join(homedir(), '.mesmice', 'keys');
  if (existsSync(keyDir)) {
    return { name: 'Keys', status: 'ok', message: keyDir };
  }
  return { name: 'Keys', status: 'warn', message: 'Not found (run "mesmice keys" to generate)' };
}
