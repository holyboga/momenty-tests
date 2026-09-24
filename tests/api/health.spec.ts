import { test, expect } from "../../src/fixtures";

test.describe("GET /api/health", () => {
  test("отвечает 200 и ok:true — база доступна", async ({ anonApi }) => {
    const r = await anonApi.get("/api/health");
    expect(r.status()).toBe(200);
    const body = await r.json();
    expect(body.ok).toBe(true);
    // дата в ISO — иначе мониторинг не сможет её разобрать
    expect(() => new Date(body.at).toISOString()).not.toThrow();
    expect(r.headers()["cache-control"]).toContain("no-store");
  });
});
