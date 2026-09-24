import { test, expect } from "../../src/fixtures";

test.describe("Владельческие эндпоинты", () => {
  test("владелец видит настройки; двери открыты для тестов", async ({ ownerApi }) => {
    const me = await (await ownerApi.get("/api/me")).json();
    expect(me.role).toBe("owner");

    const r = await ownerApi.get("/api/owner/settings");
    expect(r.status()).toBe(200);
    const s = await r.json();
    expect(s.joinOpen).toBe(true);
    expect(s.guestsCanPost).toBe(true);
    expect(s.membersCount).toBeGreaterThanOrEqual(2); // как минимум оба владельца
  });

  test("гость → 403, без сессии → 401", async ({ guest, anonApi }) => {
    const g = await guest.api.get("/api/owner/settings");
    expect(g.status()).toBe(403);
    expect((await g.json()).error).toBe("Только для владельцев");

    const a = await anonApi.get("/api/owner/settings");
    expect(a.status()).toBe(401);
  });

  test("владельцы идут первыми в списке участников", async ({ guest }) => {
    const { members } = await (await guest.api.get("/api/members")).json();
    expect(members.length).toBeGreaterThanOrEqual(3);
    expect(members[0].role).toBe("owner");
    expect(members[1].role).toBe("owner");
    expect(members.some((m: { me: boolean; name: string }) => m.me && m.name === guest.name)).toBe(true);
  });
});
