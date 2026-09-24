// Общие настройки запуска приложения «Моменты» под тесты.
//
// Главное правило: тесты НИКОГДА не ходят в прод. В .env.local приложения лежат
// ключи от Neon и Яндекс S3 — поэтому все «опасные» переменные принудительно
// обнуляются. Next.js и Node не перезаписывают уже заданные переменные значениями
// из .env-файлов, а пустая строка считается заданной. В итоге приложение берёт
// PGlite в .data/pg и файловое хранилище в .data/media — как в обычной локальной
// разработке.
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// Приложение ищется в APP_DIR, а без него — в соседней папке ../present (репозитории лежат рядом).
export const APP_DIR = process.env.APP_DIR || path.resolve(ROOT, "..", "present");
export const PORT = Number(process.env.APP_PORT || 3100);
export const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
export const LINKS_FILE = path.join(ROOT, ".auth", "links.json");

// Двери открыты и капсула закрыта «навсегда» — детерминированное состояние для тестов.
export const FAR_FUTURE = "2099-01-01T00:00:00+03:00";

export function safeEnv() {
  return {
    ...process.env,
    // база и хранилище — только локальные
    DATABASE_URL: "",
    DATABASE_URL_UNPOOLED: "",
    POSTGRES_URL: "",
    S3_BUCKET: "",
    S3_ACCESS_KEY_ID: "",
    S3_SECRET_ACCESS_KEY: "",
    // интеграции выключены
    VAPID_PUBLIC_KEY: "",
    VAPID_PRIVATE_KEY: "",
    TG_BOT_TOKEN: "",
    TG_CHANNEL_ID: "",
    // секрет — из .data/secret, одинаковый для seed и сервера
    APP_SECRET: "",
    // «личность» свадьбы под тесты
    NEXT_PUBLIC_BASE_URL: BASE_URL,
    NEXT_PUBLIC_W_JOIN_CLOSES: FAR_FUTURE,
    NEXT_PUBLIC_W_CAPSULE_OPENS: FAR_FUTURE,
    PORT: String(PORT),
  };
}
