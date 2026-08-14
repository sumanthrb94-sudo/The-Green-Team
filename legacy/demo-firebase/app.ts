/**
 * Demo stand-in for `firebase/app`.
 *
 * Only loaded when Vite runs with `--config vite.demo.config.ts` (npm run dev:demo).
 * Never bundled into a production build.
 */

export interface DemoApp {
  name: string;
  options: Record<string, unknown>;
  __demo: true;
}

const apps: DemoApp[] = [];

export function initializeApp(options: Record<string, unknown>, name = '[DEFAULT]'): DemoApp {
  const app: DemoApp = { name, options, __demo: true };
  apps.push(app);
  return app;
}

export function getApps(): DemoApp[] {
  return apps;
}

export function getApp(name = '[DEFAULT]'): DemoApp {
  const found = apps.find(a => a.name === name);
  if (!found) throw new Error(`[demo-firebase] No app named ${name}`);
  return found;
}
