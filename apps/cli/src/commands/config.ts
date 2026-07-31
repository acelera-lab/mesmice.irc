import { loadConfig, saveConfig } from '@mesmice/common';

export function configCommand(key?: string, value?: string): void {
  if (key && value) {
    saveConfig({ [key]: value });
    console.log(`Config updated: ${key}=${value}`);
  } else if (key) {
    const config = loadConfig();
    const val = (config as unknown as Record<string, unknown>)[key];
    if (val !== undefined) {
      console.log(`${key}=${val}`);
    } else {
      console.log(`Unknown config key: ${key}`);
    }
  } else {
    const config = loadConfig();
    console.log('Mesmice.IRC Configuration:');
    console.log(`  nickname: ${config.nickname}`);
    console.log(`  theme:    ${config.theme}`);
    console.log(`  server:   ${config.server || '(not set)'}`);
    console.log(`  history:  ${config.history}`);
  }
}
