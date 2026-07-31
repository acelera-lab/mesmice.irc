interface RegisterBody {
  username: string;
  password: string;
  nickname: string;
}

interface RegisterResult {
  response: Response;
  data: { nickname?: string; error?: string };
}

export async function postRegister(
  server: string,
  port: number | undefined,
  body: RegisterBody,
): Promise<RegisterResult> {
  const urls =
    port !== undefined
      ? [`http://${server}:5001/api/auth/register`, `https://${server}/api/auth/register`]
      : [`http://${server}/api/auth/register`];

  let lastError: unknown = null;

  for (const url of urls) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(8000),
      });
      return { response, data: (await response.json()) as RegisterResult['data'] };
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError;
}
