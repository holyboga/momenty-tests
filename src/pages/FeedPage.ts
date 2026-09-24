import type { Page } from "@playwright/test";

// Лента: /feed — вертикальный пейджер моментов, нижняя навигация.
export class FeedPage {
  constructor(private page: Page) {}

  readonly title = () => this.page.getByRole("heading", { level: 1 });
  readonly navFeed = () => this.page.getByRole("link", { name: "Лента" });
  readonly navCapsule = () => this.page.getByRole("link", { name: "Капсула" });
  readonly navProfile = () => this.page.getByRole("link", { name: "Профиль" });
  readonly newMomentFab = () => this.page.getByRole("link", { name: "Новый момент" });
  readonly emptyState = () => this.page.getByText("Пока пусто");
  readonly postWithText = (text: string) => this.page.locator("article", { hasText: text });

  async goto() {
    await this.page.goto("/feed");
  }
}
