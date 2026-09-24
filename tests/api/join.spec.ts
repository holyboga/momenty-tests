import { test, expect } from "../../src/fixtures";
import { links, uid } from "../../src/links";

test.describe("POST /api/join — вход по приглашению", () => {
  test("валидный токен и имя → 200, сессия в cookie, /api/me отдаёт гостя", async ({ anonApi }) => {
    const name = `Гость ${uid()}`;
    const r = await anonApi.post("/api/join", { data: { token: links().guestToken, name } });
    expect(r.status()).toBe(200);
    const body = await r.json();
    expect(body.ok).toBe(true);
    expect(typeof body.memberId).toBe("string");
    // cookie сессии: HttpOnly — из JS её не украсть
    expect(r.headers()["set-cookie"]).toMatch(/msid=.*HttpOnly/);

    const me = await anonApi.get("/api/me");
    expect(me.status()).toBe(200);
    const meBody = await me.json();
    expect(meBody).toMatchObject({ id: body.memberId, name, role: "guest" });
    expect(meBody.personalLink).toMatch(/^\/m\/[A-Za-z0-9]+$/);
  });

  test("чужой или битый токен → 403 с понятным текстом", async ({ anonApi }) => {
    const r = await anonApi.post("/api/join", { data: { token: "definitely-not-a-token", name: "Кто-то" } });
    expect(r.status()).toBe(403);
    expect((await r.json()).error).toBe("Ссылка-приглашение не подошла");
  });

  test("без имени → 400", async ({ anonApi }) => {
    const r = await anonApi.post("/api/join", { data: { token: links().guestToken, name: "   " } });
    expect(r.status()).toBe(400);
    expect((await r.json()).error).toBe("Нужны приглашение и имя");
  });

  test("граница: имя длиннее 40 символов обрезается до 40", async ({ anonApi }) => {
    const long = `Гость ${uid()} ${"я".repeat(60)}`;
    const r = await anonApi.post("/api/join", { data: { token: links().guestToken, name: long } });
    expect(r.status()).toBe(200);
    const me = await (await anonApi.get("/api/me")).json();
    expect(me.name).toHaveLength(40);
    expect(me.name).toBe(long.slice(0, 40));
  });

  test("невалидный JSON в теле → 400, а не 500", async ({ anonApi }) => {
    const r = await anonApi.post("/api/join", {
      headers: { "Content-Type": "application/json" },
      data: "{not json",
    });
    expect(r.status()).toBe(400);
  });
});

test.describe("Доступ без сессии", () => {
  for (const path of ["/api/me", "/api/posts", "/api/members"]) {
    test(`GET ${path} → 401`, async ({ anonApi }) => {
      const r = await anonApi.get(path);
      expect(r.status()).toBe(401);
      expect((await r.json()).error).toBe("Нужно войти по ссылке-приглашению");
    });
  }
});
