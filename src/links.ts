import fs from "node:fs";
import path from "node:path";

// Ссылки и токены, которые bootstrap разобрал из вывода seed приложения.
export type Links = {
  baseURL: string;
  guestToken: string;
  owners: { name: string; session: string }[];
  adminKey: string;
  screenKey: string;
};

const FILE = path.resolve(__dirname, "..", ".auth", "links.json");

export function links(): Links;
export function links(required: true): Links;
export function links(required: false): Links | null;
export function links(required = true): Links | null {
  if (!fs.existsSync(FILE)) {
    if (required) throw new Error("Нет .auth/links.json — сначала `npm run bootstrap`");
    return null;
  }
  return JSON.parse(fs.readFileSync(FILE, "utf8")) as Links;
}

// Уникальный суффикс: тесты идут параллельно и не должны путать чужие данные со своими.
export const uid = () => Math.random().toString(36).slice(2, 8);
