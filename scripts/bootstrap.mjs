// Подготовка приложения к прогону: база, схема, приглашения и владельцы, открытые двери.
// Запускается ДО старта сервера (Playwright зовёт его через npm test). Работает и при
// уже запущенном сервере тестов: схема идемпотентна, данные очищаются TRUNCATE-ом.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { APP_DIR, BASE_URL, DB_URL, LINKS_FILE, ROOT, safeEnv } from "./app-env.mjs";

function fail(msg) {
  console.error(`\n✖ ${msg}\n`);
  process.exit(1);
}

function run(cmd, args, label) {
  const r = spawnSync(cmd, args, { cwd: APP_DIR, env: safeEnv(), encoding: "utf8" });
  if (r.status !== 0) {
    console.error(r.stdout);
    console.error(r.stderr);
    fail(`${label}: код ${r.status}`);
  }
  return r.stdout;
}

if (!fs.existsSync(path.join(APP_DIR, "package.json"))) fail(`Не нашёл приложение в ${APP_DIR}. Задайте APP_DIR.`);
if (!fs.existsSync(path.join(APP_DIR, "node_modules"))) fail(`В ${APP_DIR} нет node_modules — выполните там npm install.`);

// Драйвер pg берём из node_modules приложения: свой драйвер тестам не нужен.
const requireFromApp = createRequire(path.join(APP_DIR, "package.json"));
let pg;
try {
  pg = requireFromApp("pg");
} catch {
  fail(`В ${APP_DIR} нет пакета pg — выполните там npm install.`);
}

const DATA_TABLES = ["reactions", "posts", "sessions", "members", "invites", "push_subscriptions"];

// Postgres отвечает? База для тестов есть? Создаём при первом запуске.
async function ensureDatabase() {
  const url = new URL(DB_URL);
  const dbName = decodeURIComponent(url.pathname.slice(1));
  const adminUrl = new URL(DB_URL);
  adminUrl.pathname = "/postgres";
  const client = new pg.Client({ connectionString: adminUrl.toString() });
  try {
    await client.connect();
  } catch (e) {
    fail(
      `Postgres недоступен (${url.host}): ${e.message}\n` +
        `  Запустите контейнер: docker run -d --name momenty-pg -p 5432:5432 -e POSTGRES_PASSWORD=momenty -e POSTGRES_DB=momenty postgres:16-alpine\n` +
        `  или задайте E2E_DATABASE_URL.`
    );
  }
  const r = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [dbName]);
  if (r.rows.length === 0) {
    await client.query(`CREATE DATABASE "${dbName.replace(/"/g, '""')}"`);
    console.log(`→ создана база ${dbName}`);
  }
  await client.end();
  return dbName;
}

// Чистая база на каждый прогон: данные — долой, схема и settings остаются.
async function truncateData() {
  const client = new pg.Client({ connectionString: DB_URL });
  await client.connect();
  const r = await client.query(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = ANY($1)",
    [DATA_TABLES]
  );
  const present = r.rows.map((x) => x.tablename);
  if (present.length) await client.query(`TRUNCATE ${present.map((t) => `"${t}"`).join(", ")} RESTART IDENTITY CASCADE`);
  await client.end();
}

console.log(`→ приложение: ${APP_DIR}`);
console.log(`→ адрес для тестов: ${BASE_URL}`);

const dbName = await ensureDatabase();
console.log(`→ база: ${dbName} (локальный Postgres)`);

console.log("→ схема БД");
run("node", ["scripts/migrate.mjs"], "migrate");

console.log("→ чистые таблицы");
await truncateData();

console.log("→ приглашения и владельцы");
const seedOut = run("node", ["scripts/seed.mjs"], "seed");

console.log("→ двери открыты, капсула закрыта");
run("node", [path.join(ROOT, "scripts", "force-settings.mjs")], "force-settings");

// Разбираем ссылки из вывода seed: это единственное место, где приложение отдаёт токены.
const guestToken = seedOut.match(/\/join\?t=([A-Za-z0-9]+)/)?.[1];
const owners = [...seedOut.matchAll(/Вход (\S+):\s+\S+\/m\/([A-Za-z0-9]+)/g)].map((m) => ({ name: m[1], session: m[2] }));
const adminKey = seedOut.match(/\/gift\?key=([A-Za-z0-9_-]+)/)?.[1];
const screenKey = seedOut.match(/\/screen\?key=([A-Za-z0-9_-]+)/)?.[1];
if (!guestToken || owners.length < 2 || !adminKey || !screenKey) {
  console.error(seedOut);
  fail("Не смог разобрать ссылки из вывода seed — формат изменился?");
}

fs.mkdirSync(path.dirname(LINKS_FILE), { recursive: true });
fs.writeFileSync(LINKS_FILE, JSON.stringify({ baseURL: BASE_URL, guestToken, owners, adminKey, screenKey }, null, 2));
console.log(`✓ ссылки сохранены: ${path.relative(ROOT, LINKS_FILE)} (гость, ${owners.map((o) => o.name).join(" и ")}, экранный ключ)`);
