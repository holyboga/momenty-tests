import { test, expect } from "../../src/fixtures";
import { uid } from "../../src/links";

test.describe("Реакции: /api/react", () => {
  test("реакция — переключатель: поставить, увидеть в ленте, снять", async ({ guest }) => {
    const { id } = await (await guest.api.post("/api/posts", { data: { kind: "text", caption: `Реакция ${uid()}` } })).json();

    const on = await guest.api.post("/api/react", { data: { postId: id, emoji: "❤️" } });
    expect(on.status()).toBe(200);
    expect(await on.json()).toEqual({ ok: true });

    const feed = await (await guest.api.get("/api/posts")).json();
    const post = feed.posts.find((p: { id: string }) => p.id === id);
    expect(post.reactions).toEqual([{ emoji: "❤️", count: 1, mine: true }]);

    const off = await guest.api.post("/api/react", { data: { postId: id, emoji: "❤️" } });
    expect(await off.json()).toEqual({ ok: true, removed: true });
  });

  test("эмодзи вне списка → 400", async ({ guest }) => {
    const { id } = await (await guest.api.post("/api/posts", { data: { kind: "text", caption: `Эмодзи ${uid()}` } })).json();
    const r = await guest.api.post("/api/react", { data: { postId: id, emoji: "💩" } });
    expect(r.status()).toBe(400);
    expect((await r.json()).error).toBe("bad emoji");
  });

  test("несуществующий момент → 404", async ({ guest }) => {
    const r = await guest.api.post("/api/react", { data: { postId: "nope-nope-nope-00", emoji: "🔥" } });
    expect(r.status()).toBe(404);
  });
});
