import { test, expect } from "../../src/fixtures";
import { links } from "../../src/links";
import { ScreenPage } from "../../src/pages/ScreenPage";

test.use({ guestSession: false });

test.describe("Экран для проектора", () => {
  test("по экранному ключу — QR и подсказка", async ({ page }) => {
    const screen = new ScreenPage(page);
    await screen.goto(links().screenKey);
    await expect(screen.qr()).toBeVisible();
    await expect(screen.hint()).toBeVisible();
  });

  test("без ключа — на главную", async ({ page }) => {
    const screen = new ScreenPage(page);
    await screen.goto();
    await expect(page).toHaveURL("/");
  });
});
