// Общие настройки запуска приложения «Моменты» под тесты.
//
// Главное правило: тесты НИКОГДА не ходят в прод. В .env.local приложения лежат
// ключи от Neon и Яндекс S3 — поэтому все «опасные» переменные принудительно
// обнуляются, а база подменяется на локальный Postgres (отдельная база momenty_e2e,
// чтобы migrate → seed не трогали базу, в которой вы работаете руками). Next.js и Node
// не перезаписывают уже заданные переменные значениями из .env-файлов, а пустая строка
// считается заданной. Медиа — файловое хранилище в .data/media, как в обычной разработке.
//
// История: до 25.09.2026 тесты жили на встроенной PGlite; после рефакторинга приложения
// его скрипты migrate/seed работают только с настоящим Postgres — тесты переехали вместе с ними.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// Приложение ищется в APP_DIR, а без него — в соседней папке ../present (репозитории лежат рядом).
export const APP_DIR = process.env.APP_DIR || path.resolve(ROOT, "..", "present");
export const PORT = Number(process.env.APP_PORT || 3100);
export const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
export const LINKS_FILE = path.join(ROOT, ".auth", "links.json");

// Локальный Postgres: контейнер momenty-pg (команда запуска — в README), база momenty_e2e.
export const DB_URL =
  process.env.E2E_DATABASE_URL ?? "postgres://postgres:momenty@localhost:5432/momenty_e2e?sslmode=disable";

// Двери открыты и капсула закрыта «навсегда» — детерминированное состояние для тестов.
export const FAR_FUTURE = "2099-01-01T00:00:00+03:00";

// Секрет приложения — тот же, что оно само использует в dev-режиме (.data/secret):
// seed выводит ключи /screen и /gift из секрета, и сервер должен знать тот же секрет.
// Файла нет — создаём (как делает само приложение при первом запуске).
export function appSecret() {
  const file = path.join(APP_DIR, ".data", "secret");
  if (fs.existsSync(file)) {
    const s = fs.readFileSync(file, "utf8").trim();
    if (s.length >= 32) return s;
  }
  const s = crypto.randomBytes(32).toString("hex");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, s, { mode: 0o600 });
  return s;
}

export function safeEnv() {
  return {
    ...process.env,
    // база — только локальная тестовая; прочие строки подключения гасим
    DATABASE_URL: DB_URL,
    DATABASE_URL_UNPOOLED: "",
    POSTGRES_URL: "",
    // хранилище — только файловое
    S3_BUCKET: "",
    S3_ACCESS_KEY_ID: "",
    S3_SECRET_ACCESS_KEY: "",
    // интеграции выключены
    VAPID_PUBLIC_KEY: "",
    VAPID_PRIVATE_KEY: "",
    TG_BOT_TOKEN: "",
    TG_CHANNEL_ID: "",
    // секрет — общий для seed и сервера
    APP_SECRET: appSecret(),
    // «личность» свадьбы под тесты
    BASE_URL,
    NEXT_PUBLIC_BASE_URL: BASE_URL,
    NEXT_PUBLIC_W_JOIN_CLOSES: FAR_FUTURE,
    NEXT_PUBLIC_W_CAPSULE_OPENS: FAR_FUTURE,
    PORT: String(PORT),
  };
}
