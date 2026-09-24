// Запуск dev-сервера приложения в безопасном окружении (см. app-env.mjs).
// Playwright вызывает этот скрипт как webServer и сам гасит его после прогона.
import { spawn } from "node:child_process";
import { APP_DIR, PORT, safeEnv } from "./app-env.mjs";

const child = spawn("npx", ["next", "dev", "-p", String(PORT)], {
  cwd: APP_DIR,
  env: safeEnv(),
  stdio: "inherit",
});
for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => child.kill(sig));
child.on("exit", (code) => process.exit(code ?? 0));
