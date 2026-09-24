import type { Page } from "@playwright/test";

// Страница входа по приглашению: /join?t=<token>
export class JoinPage {
  constructor(private page: Page) {}

  readonly title = () => this.page.getByRole("heading", { level: 1 });
  readonly nameInput = () => this.page.getByPlaceholder("Например, тётя Оля");
  readonly submit = () => this.page.getByRole("button", { name: "Войти в ленту" });
  readonly error = () => this.page.locator("p", { hasText: /не подошла|закрыт|Слишком/ });

  async goto(token: string) {
    await this.page.goto(`/join?t=${token}`);
  }

  async join(name: string) {
    await this.nameInput().fill(name);
    await this.submit().click();
  }
}
