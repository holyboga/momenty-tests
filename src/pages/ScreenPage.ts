import type { Page } from "@playwright/test";

// Экранный режим для проектора: /screen?key=<screenKey> — большой QR на вход.
export class ScreenPage {
  constructor(private page: Page) {}

  readonly qr = () => this.page.getByRole("img", { name: "QR" });
  readonly hint = () => this.page.getByText("Наведите камеру");

  async goto(key?: string) {
    await this.page.goto(key ? `/screen?key=${key}` : "/screen");
  }
}
