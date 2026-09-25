// Приводит таблицу settings к состоянию для тестов: двери открыты, капсула закрыта,
// гости могут постить. Запускается из каталога приложения (cwd = APP_DIR): драйвер pg
// берётся из его node_modules, строка подключения — из DATABASE_URL (safeEnv → momenty_e2e).
import { createRequire } from "node:module";
import path from "node:path";

const { Client } = createRequire(path.join(process.cwd(), "package.json"))("pg");
const FAR_FUTURE = "2099-01-01T00:00:00+03:00";

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
await client.query(
  `UPDATE settings
     SET join_open = TRUE, join_closes_at = $1, capsule_open_at = $2, guests_can_post = TRUE
   WHERE id = 1`,
  [FAR_FUTURE, FAR_FUTURE]
);
await client.end();
console.log("settings: join open, capsule sealed until", FAR_FUTURE);
