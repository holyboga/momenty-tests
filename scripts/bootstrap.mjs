// Подготовка приложения к прогону: схема БД, приглашения и владельцы, открытые двери.
// Запускается ДО старта сервера: локальная база PGlite однопроцессная, и seed
// нельзя выполнять, пока работает `next dev`.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { APP_DIR, BASE_URL, LINKS_FILE, ROOT, safeEnv } from "./app-env.mjs";

function fail(msg) {
  console.error(`\n✖ ${msg}\n`);
  process.exit(1);
}

function run(args, label) {
  const r = spawnSync("npx", args, { cwd: APP_DIR, env: safeEnv(), encoding: "utf8" });
  if (r.status !== 0) {
    console.error(r.stdout);
    console.error(r.stderr);
    fail(`${label}: код ${r.status}`);
  }
  return r.stdout;
}

async function portBusy(port) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 1500);
    const r = await fetch(`http://localhost:${port}/api/health`, { signal: ctrl.signal });
    clearTimeout(t);
    return r.ok;
  } catch {
    return false;
  }
}

if (!fs.existsSync(path.join(APP_DIR, "package.json"))) fail(`Не нашёл приложение в ${APP_DIR}. Задайте APP_DIR.`);
if (!fs.existsSync(path.join(APP_DIR, "node_modules"))) fail(`В ${APP_DIR} нет node_modules — выполните там npm install.`);

// Обычный dev-сервер приложения на 3000 держит ту же PGlite-базу — параллельный
// seed её сломает. Просим остановить.
if (await portBusy(3000)) fail("На порту 3000 работает dev-сервер приложения. Остановите его (PGlite — однопроцессная) и повторите.");

console.log(`→ приложение: ${APP_DIR}`);
console.log(`→ адрес для тестов: ${BASE_URL}`);

console.log("→ схема БД");
run(["tsx", "scripts/migrate.ts"], "migrate");

console.log("→ приглашения и владельцы");
const seedOut = run(["tsx", "scripts/seed.ts"], "seed");

console.log("→ двери открыты, капсула закрыта");
run(["tsx", path.join(ROOT, "scripts", "force-settings.mts")], "force-settings");

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
