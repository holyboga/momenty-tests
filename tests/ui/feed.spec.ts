import { test, expect } from "../../src/fixtures";
import { uid } from "../../src/links";
import { FeedPage } from "../../src/pages/FeedPage";
import { NewMomentPage } from "../../src/pages/NewMomentPage";
import { MembersPage } from "../../src/pages/MembersPage";

// Браузер уже под гостем (storageState из фикстур).
test.describe("Лента и создание момента", () => {
  test("текстовый момент: «+» → Текст → Поделиться → виден в ленте", async ({ page }) => {
    const feed = new FeedPage(page);
    const compose = new NewMomentPage(page);
    const text = `Автотест ${uid()}: за любовь и терпение`;

    await feed.goto();
    await feed.newMomentFab().click();
    await expect(page).toHaveURL(/\/new$/);

    await compose.openTextMode();
    await expect(compose.share()).toBeDisabled(); // пусто — отправлять нечего
    await compose.textarea().fill(text);
    await expect(compose.counter(text.length)).toBeVisible();
    await compose.share().click();

    await expect(page).toHaveURL(/\/feed$/);
    await expect(feed.postWithText(text)).toBeVisible();
  });

  test("запечатанный момент: экран «Запечатано!» и его нет в ленте", async ({ page }) => {
    const feed = new FeedPage(page);
    const compose = new NewMomentPage(page);
    const text = `Капсула ${uid()}: откроется через год`;

    await compose.goto();
    await compose.createText(text, { sealed: true });
    await expect(compose.sealedDone()).toBeVisible();

    await feed.goto();
    await expect(feed.postWithText(text)).toHaveCount(0);
  });

  test("участники: гость видит себя с пометкой «(вы)»", async ({ page }) => {
    const members = new MembersPage(page);
    // имя гостя берём из /api/me — cookie уже в браузере
    const me = await (await page.request.get("/api/me")).json();

    await members.goto();
    await expect(members.title()).toBeVisible();
    await expect(members.rowFor(me.name)).toContainText("(вы)");
    // владельцы первыми и с кольцом
    await expect(members.rows().first()).toContainText("💍");
  });
});
