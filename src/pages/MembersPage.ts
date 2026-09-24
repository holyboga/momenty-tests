import type { Page } from "@playwright/test";

// Участники: /members — список с владельцами первыми, «(вы)» у себя.
export class MembersPage {
  constructor(private page: Page) {}

  readonly title = () => this.page.getByRole("heading", { name: "Участники" });
  readonly rows = () => this.page.locator("li");
  readonly rowFor = (name: string) => this.page.locator("li", { hasText: name });

  async goto() {
    await this.page.goto("/members");
  }
}
