export function formatMessage(sender: string, content: string, color: string): string {
  return ` {bold}{${color}-fg}<${sender}>{/} ${content}`;
}

export function formatActionMessage(sender: string, action: string): string {
  return ` {yellow-fg}* {/}{italic}{yellow-fg}${sender} ${action}{/}`;
}

export function formatSystemMessage(content: string): string {
  return ` {green-fg}* {/}{green-fg}${content}{/}`;
}

export function addMessageToBox(box: any, formatted: string): void {
  const current = box.getContent();
  const lines = current.split('\n').filter(Boolean);
  lines.push(formatted);
  if (lines.length > 500) {
    lines.splice(0, lines.length - 500);
  }
  box.setContent(lines.join('\n'));
  box.setScrollPerc(100);
}

export function addSystemMessageToBox(box: any, content: string): void {
  addMessageToBox(box, formatSystemMessage(content));
}
