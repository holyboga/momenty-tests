// Приводит таблицу settings к состоянию для тестов: двери открыты, капсула закрыта,
// гости могут постить. Запускается tsx-ом из каталога приложения (cwd = APP_DIR),
// поэтому импортируем его же lib/db — с той же PGlite-базой, что и сервер.
import path from "node:path";
import { pathToFileURL } from "node:url";

const FAR_FUTURE = "2099-01-01T00:00:00+03:00";
const dbModule = pathToFileURL(path.join(process.cwd(), "lib", "db.ts")).href;
const { q } = (await import(dbModule)) as { q: (t: string, p?: unknown[]) => Promise<unknown> };

await q(
  `UPDATE settings
     SET join_open = TRUE, join_closes_at = $1, capsule_open_at = $2, guests_can_post = TRUE
   WHERE id = 1`,
  [FAR_FUTURE, FAR_FUTURE]
);
console.log("settings: join open, capsule sealed until", FAR_FUTURE);
process.exit(0);
