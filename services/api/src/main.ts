import { createApiApp } from './bootstrap.js';
import { parseApiEnvironment } from './config/env.js';

async function main(): Promise<void> {
  const environment = parseApiEnvironment();
  const app = await createApiApp(environment);
  await app.listen({ host: environment.API_HOST, port: environment.API_PORT });
}

void main();
