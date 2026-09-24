import { test, expect } from "../../src/fixtures";
import { links, uid } from "../../src/links";
import { JoinPage } from "../../src/pages/JoinPage";
import { FeedPage } from "../../src/pages/FeedPage";

// Здесь нужен браузер БЕЗ сессии — отключаем гостевую cookie из фикстур.
test.use({ guestSession: false });

test.describe("Вход гостя по QR-ссылке", () => {
  test("имя → «Войти в ленту» → лента", async ({ page }) => {
    const join = new JoinPage(page);
    const feed = new FeedPage(page);
    await join.goto(links().guestToken);
    await expect(join.title()).toHaveText("Моменты");
    await expect(join.submit()).toBeDisabled(); // пока имя пустое

    await join.join(`Гость ${uid()}`);
    await expect(page).toHaveURL(/\/feed$/);
    await expect(feed.title()).toHaveText("Моменты");
    await expect(feed.navFeed()).toHaveAttribute("aria-current", "page");
  });

  test("битый токен → на главную с подсказкой про приглашение", async ({ page }) => {
    await page.goto("/join?t=nope");
    await expect(page).toHaveURL("/");
    await expect(page.getByText("Вход — по ссылке-приглашению")).toBeVisible();
  });

  test("лента без сессии недоступна → редирект на главную", async ({ page }) => {
    await page.goto("/feed");
    await expect(page).toHaveURL("/");
  });
});
