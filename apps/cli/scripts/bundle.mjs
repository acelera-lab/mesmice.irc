import { build } from 'esbuild';
import { readFileSync, writeFileSync } from 'node:fs';

await build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node22',
  outfile: 'dist/index.cjs',
  external: ['blessed', 'term.js', 'pty.js'],
  logLevel: 'info',
});

const out = 'dist/index.cjs';
let code = readFileSync(out, 'utf8');
if (!code.startsWith('#!/usr/bin/env node')) {
  writeFileSync(out, `#!/usr/bin/env node\n${code}`);
}
