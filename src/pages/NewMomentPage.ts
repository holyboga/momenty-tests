import type { Page } from "@playwright/test";

// Экран создания момента: /new. Камера/галерея/голос/текст; тесты используют текст —
// он не требует ни камеры, ни загрузки файлов.
export class NewMomentPage {
  constructor(private page: Page) {}

  readonly textModeButton = () => this.page.getByRole("button", { name: /Текст/ });
  readonly textarea = () => this.page.getByPlaceholder("Пожелание, тост, воспоминание…");
  readonly counter = (n: number, max = 500) => this.page.getByText(`${n}/${max}`, { exact: true });
  readonly sealCheckbox = () => this.page.getByRole("checkbox");
  readonly share = () => this.page.getByRole("button", { name: "Поделиться" });
  readonly seal = () => this.page.getByRole("button", { name: "Запечатать" });
  readonly cancel = () => this.page.getByRole("button", { name: "Отмена" });
  readonly sealedDone = () => this.page.getByRole("heading", { name: "Запечатано!" });

  async goto() {
    await this.page.goto("/new");
  }

  async openTextMode() {
    await this.textModeButton().click();
    await this.textarea().waitFor();
  }

  async createText(text: string, opts: { sealed?: boolean } = {}) {
    await this.openTextMode();
    await this.textarea().fill(text);
    if (opts.sealed) {
      await this.sealCheckbox().check();
      await this.seal().click();
    } else {
      await this.share().click();
    }
  }
}
