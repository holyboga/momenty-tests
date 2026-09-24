import { test as base, expect, request, type APIRequestContext } from "@playwright/test";
import { links, uid } from "./links";

// Гость, вошедший через API. Для браузерных тестов его cookie подкладывается в контекст —
// быстрее и стабильнее, чем логиниться через форму в каждом тесте.
export type Guest = { api: APIRequestContext; memberId: string; name: string };

// Вход по приглашению с учётом антиспама приложения: не больше 30 входов в минуту на всех.
// При 429 ждём и повторяем — так повторный прогон не падает из-за предыдущего.
export async function joinAsGuest(name = `Гость ${uid()}`): Promise<Guest> {
  const api = await request.newContext({ baseURL: links().baseURL });
  for (let attempt = 1; ; attempt++) {
    const r = await api.post("/api/join", { data: { token: links().guestToken, name } });
    if (r.status() === 200) {
      const { memberId } = (await r.json()) as { memberId: string };
      return { api, memberId, name };
    }
    if (r.status() === 429 && attempt < 6) {
      await new Promise((res) => setTimeout(res, 15_000));
      continue;
    }
    throw new Error(`join: ${r.status()} ${await r.text()}`);
  }
}

type TestFixtures = {
  guest: Guest;
  ownerApi: APIRequestContext;
  anonApi: APIRequestContext;
  guestSession: boolean;
};
type WorkerFixtures = { workerGuest: Guest };

export const test = base.extend<TestFixtures, WorkerFixtures>({
  // Один гость на воркер: тесты независимы по данным (уникальные тексты), а лимит входов не тратится.
  workerGuest: [
    async ({}, use) => {
      const g = await joinAsGuest();
      await use(g);
      await g.api.dispose();
    },
    { scope: "worker" },
  ],

  guest: async ({ workerGuest }, use) => {
    await use(workerGuest);
  },

  // Владелец: личная ссылка /m/<session> ставит свежую cookie и уводит в ленту.
  ownerApi: async ({ baseURL }, use) => {
    const api = await request.newContext({ baseURL });
    const r = await api.get(`/m/${links().owners[0].session}`, { maxRedirects: 0 });
    expect([302, 307, 308]).toContain(r.status());
    await use(api);
    await api.dispose();
  },

  // Контекст без cookie — для проверок 401 и редиректов.
  anonApi: async ({ baseURL }, use) => {
    const api = await request.newContext({ baseURL });
    await use(api);
    await api.dispose();
  },

  // Браузерные тесты по умолчанию идут под гостем. Тесту без сессии: test.use({ guestSession: false }).
  guestSession: [true, { option: true }],

  context: async ({ context, workerGuest, guestSession }, use) => {
    if (guestSession) {
      const state = await workerGuest.api.storageState();
      await context.addCookies(state.cookies);
    }
    await use(context);
  },
});

export { expect };
