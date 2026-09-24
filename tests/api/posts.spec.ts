import { test, expect, joinAsGuest } from "../../src/fixtures";
import { uid } from "../../src/links";

const MAX_TEXT = 500; // config.maxTextLen в приложении

test.describe("Текстовые моменты: /api/posts", () => {
  test("создание → момент виден в ленте автора с верными полями", async ({ guest }) => {
    const caption = `Автотест ${uid()}: тост за молодых`;
    const r = await guest.api.post("/api/posts", { data: { kind: "text", caption } });
    expect(r.status()).toBe(200);
    const { id, sealed } = await r.json();
    expect(sealed).toBe(false);

    const feed = await (await guest.api.get("/api/posts")).json();
    const post = feed.posts.find((p: { id: string }) => p.id === id);
    expect(post).toMatchObject({
      kind: "text",
      caption,
      sealed: false,
      mine: true,
      reactions: [],
      author: { id: guest.memberId, name: guest.name, role: "guest" },
    });
    expect(feed.me).toMatchObject({ id: guest.memberId, name: guest.name });
  });

  test("пустой текст → 400", async ({ guest }) => {
    const r = await guest.api.post("/api/posts", { data: { kind: "text", caption: "   \n " } });
    expect(r.status()).toBe(400);
    expect((await r.json()).error).toBe("Напишите хотя бы пару слов");
  });

  test(`граница: текст длиннее ${MAX_TEXT} обрезается ровно до ${MAX_TEXT}`, async ({ guest }) => {
    const marker = `[${uid()}]`;
    const caption = marker + "ж".repeat(MAX_TEXT + 1 - marker.length + 10);
    const r = await guest.api.post("/api/posts", { data: { kind: "text", caption } });
    expect(r.status()).toBe(200);
    const { id } = await r.json();
    const { post } = await (await guest.api.get(`/api/posts/${id}`)).json();
    expect(post.caption).toHaveLength(MAX_TEXT);
    expect(post.caption.startsWith(marker)).toBe(true);
  });

  test("неизвестный тип момента → 400", async ({ guest }) => {
    const r = await guest.api.post("/api/posts", { data: { kind: "gif", caption: "x" } });
    expect(r.status()).toBe(400);
  });

  test("запечатанный момент не показывается в ленте и закрыт по прямой ссылке", async ({ guest }) => {
    const caption = `Капсула ${uid()}`;
    const r = await guest.api.post("/api/posts", { data: { kind: "text", caption, sealed: true } });
    expect(r.status()).toBe(200);
    const { id, sealed } = await r.json();
    expect(sealed).toBe(true);

    const feed = await (await guest.api.get("/api/posts")).json();
    expect(feed.posts.some((p: { id: string }) => p.id === id)).toBe(false);

    const capsuleFeed = await (await guest.api.get("/api/posts?capsule=1")).json();
    expect(capsuleFeed.posts.some((p: { id: string }) => p.id === id)).toBe(false);

    const direct = await guest.api.get(`/api/posts/${id}`);
    expect(direct.status()).toBe(403);
    expect((await direct.json()).error).toContain("запечатан");
  });

  test("гость скрывает свой момент → 200, дальше 404; чужой → 403", async ({ guest }) => {
    const { id } = await (await guest.api.post("/api/posts", { data: { kind: "text", caption: `Скрыть ${uid()}` } })).json();

    // другой гость не может скрыть чужое
    const other = await joinAsGuest();
    const forbidden = await other.api.delete(`/api/posts/${id}`);
    expect(forbidden.status()).toBe(403);
    await other.api.dispose();

    const del = await guest.api.delete(`/api/posts/${id}`);
    expect(del.status()).toBe(200);
    const after = await guest.api.get(`/api/posts/${id}`);
    expect(after.status()).toBe(404);
  });
});
