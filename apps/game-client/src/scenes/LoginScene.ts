import Phaser from "phaser";
import type { LoginResponse, PlayerProfile, RegisterResponse } from "@eidolith/shared-types";
import { network, ApiClientError } from "../net/NetworkManager";
/** Login/Register — API Part 6 §3. On success: fetch profile, then enter the world. */
export class LoginScene extends Phaser.Scene {
  constructor() { super("Login"); }
  create(): void {
    const { width } = this.scale;
    this.add.text(width / 2, 150, "EIDOLITH", { fontFamily: "'Baloo 2', sans-serif", fontSize: "56px", color: "#ffd83d", fontStyle: "bold" }).setOrigin(0.5);
    this.add.text(width / 2, 196, "The Forgotten Wilds", { fontSize: "20px", color: "#9a937f" }).setOrigin(0.5);
    if (network.isAuthenticated) { void this.enterWorld(); return; }
    this.showForm(false);
  }
  private showForm(register: boolean): void {
    this.children.getAll().filter(o => o.type === "DOMElement").forEach(o => o.destroy());
    const form = document.createElement("div");
    form.className = "eidolith-form";
    form.innerHTML = `
      ${register ? '<input id="f-username" placeholder="Username (3–32 ký tự)" autocomplete="username" /><select id="f-gender" style="width:100%;box-sizing:border-box;margin:6px 0;padding:12px;border-radius:8px;border:1.5px solid rgba(255,255,255,.16);background:#232b36;color:#f4f7fa;font-size:16px;border-radius:10px"><option value="wanderer_male">Nhân vật: Nam</option><option value="wanderer_female">Nhân vật: Nữ</option></select>' : ""}
      <input id="f-email" type="email" placeholder="Email" autocomplete="email" />
      <input id="f-password" type="password" placeholder="Mật khẩu (tối thiểu 8 ký tự, gồm chữ và số)" autocomplete="${register ? "new-password" : "current-password"}" />
      <div class="err" id="f-error"></div>
      <button id="f-submit">${register ? "Đăng ký" : "Đăng nhập"}</button>
      <button class="switch" id="f-switch">${register ? "Đã có tài khoản? Đăng nhập" : "Chưa có tài khoản? Đăng ký"}</button>`;
    const dom = this.add.dom(this.scale.width / 2, 430, form);
    form.querySelector("#f-switch")!.addEventListener("click", () => { dom.destroy(); this.showForm(!register); });
    form.querySelector("#f-submit")!.addEventListener("click", () => { void this.submit(form, register); });
  }
  private async submit(form: HTMLDivElement, register: boolean): Promise<void> {
    const errorEl = form.querySelector("#f-error") as HTMLDivElement;
    const email = (form.querySelector("#f-email") as HTMLInputElement).value.trim();
    const password = (form.querySelector("#f-password") as HTMLInputElement).value;
    try {
      if (register) {
        const username = (form.querySelector("#f-username") as HTMLInputElement).value.trim();
        await network.request<RegisterResponse>("POST", "/auth/register", { email, username, password });
      }
      const login = await network.request<LoginResponse>("POST", "/auth/login", { email, password, deviceId: "web-dev" });
      network.setTokens(login);
      if (register) {
        const avatarId = (form.querySelector("#f-gender") as HTMLSelectElement).value;
        await network.request<PlayerProfile>("PATCH", "/player/me", { avatarId }).catch(() => undefined);
      }
      await this.enterWorld();
    } catch (e) {
      errorEl.textContent = e instanceof ApiClientError ? e.message : "Không kết nối được máy chủ";
    }
  }
  private async enterWorld(): Promise<void> {
    try {
      const profile = await network.request<PlayerProfile>("GET", "/player/me");
      const snapshot = await network.connect();
      this.scene.start("World", { profile, snapshot });
    } catch {
      network.clearTokens();
      if (this.scene.isActive()) this.showForm(false);
    }
  }
}
