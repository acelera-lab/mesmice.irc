import * as readline from 'node:readline';

export interface PromptResult {
  answers: string[];
  isTTY: boolean;
}

export async function promptAll(questions: string[]): Promise<PromptResult> {
  const isTTY = process.stdin.isTTY === true;

  if (isTTY) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    const answers: string[] = [];
    for (const question of questions) {
      answers.push(
        await new Promise<string>((resolve) => {
          rl.question(`${question}: `, resolve);
        }),
      );
    }
    rl.close();
    return { answers, isTTY: true };
  }

  const answers: string[] = [];
  const rl = readline.createInterface({ input: process.stdin, terminal: false });
  for await (const line of rl) {
    answers.push(line.trim());
    if (answers.length >= questions.length) break;
  }
  return { answers, isTTY: false };
}
