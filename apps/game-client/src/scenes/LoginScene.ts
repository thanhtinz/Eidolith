import Phaser from "phaser";
import type { CharacterCreateRequest, LoginResponse, PlayerProfile, RegisterResponse } from "@eidolith/shared-types";
import { isValidUsername } from "@eidolith/validation";
import { network, ApiClientError } from "../net/NetworkManager";
import { APPEARANCE_UI, HAIR_COLORS, previewDataUrl, type GenderKey } from "../ui/appearance";
/** Entry flow (Tín's order 2026-11-12): the title background + logo show FIRST;
 *  a tap reveals the login/register form over the same art. On success: fetch
 *  profile, then enter the world. */
export class LoginScene extends Phaser.Scene {
  private revealed = false;
  private entering = false;
  private tapText?: Phaser.GameObjects.Text;
  private bgImage?: Phaser.GameObjects.Image;
  constructor() { super("Login"); }
  create(): void {
    const { width, height } = this.scale;
    if (this.textures.exists("title_bg")) {
      this.bgImage = this.add.image(width / 2, height / 2, "title_bg").setDisplaySize(width, height);
    }
    const logo = this.add.text(width / 2, 116, "EIDOLITH", { fontFamily: "'Baloo 2', sans-serif", fontSize: "64px", color: "#ffd83d", fontStyle: "bold" }).setOrigin(0.5);
    logo.setStroke("#26303a", 8);
    logo.setShadow(0, 6, "rgba(0,0,0,0.45)", 12);
    const sub = this.add.text(width / 2, 168, "T H E   F O R G O T T E N   W I L D S", { fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: "17px", color: "#eef6ff", fontStyle: "bold" }).setOrigin(0.5);
    sub.setStroke("rgba(20,28,38,0.85)", 4);
    this.add.text(width / 2, height - 20, "Phiên bản thử nghiệm · Eidolith – The Forgotten Wilds", { fontSize: "13px", color: "rgba(255,255,255,0.85)" }).setOrigin(0.5).setShadow(0, 1, "rgba(0,0,0,0.8)", 4);
    if (network.isAuthenticated) { this.showServerSelect(); return; }
    this.tapText = this.add.text(width / 2, 596, "— CHẠM ĐỂ VÀO GAME —", { fontFamily: "'Baloo 2', sans-serif", fontSize: "22px", color: "#ffffff", fontStyle: "bold" }).setOrigin(0.5);
    this.tapText.setStroke("rgba(20,28,38,0.85)", 5);
    this.tweens.add({ targets: this.tapText, alpha: 0.6, duration: 850, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    const reveal = () => this.revealForm();
    this.input.once("pointerdown", reveal);
    this.input.keyboard?.once("keydown", reveal);
    (window as unknown as { __eidolithStart?: () => void }).__eidolithStart = reveal;
  }
  private revealForm(): void {
    if (this.revealed) return;
    this.revealed = true;
    this.tapText?.destroy();
    this.showForm(false);
  }
  private showForm(register: boolean): void {
    this.children.getAll().filter(o => o.type === "DOMElement").forEach(o => o.destroy());
    const form = document.createElement("div");
    form.className = "eidolith-form";
    form.innerHTML = `
      <div class="f-tabs"><button class="f-tab${register ? "" : " on"}" id="f-tab-login">Đăng nhập</button><button class="f-tab${register ? " on" : ""}" id="f-tab-register">Đăng ký</button></div>
      <input id="f-email" type="email" placeholder="Email" autocomplete="email" />
      <input id="f-password" type="password" placeholder="Mật khẩu (tối thiểu 8 ký tự)" autocomplete="${register ? "new-password" : "current-password"}" />
      <div class="err" id="f-error"></div>
      <button id="f-submit">${register ? "Đăng ký" : "Đăng nhập"}</button>
      <div class="f-or">HOẶC TIẾP TỤC VỚI</div>
      <div class="f-social"><button class="f-soc g" id="f-google"><i class="fa-brands fa-google"></i>Google</button><button class="f-soc a" id="f-apple"><i class="fa-brands fa-apple"></i>Apple</button></div>`;
    const dom = this.add.dom(this.scale.width / 2, 430, form);
    dom.setAlpha(0);
    this.tweens.add({ targets: dom, alpha: 1, duration: 320, ease: "Sine.easeOut" });
    form.querySelector("#f-tab-login")!.addEventListener("click", () => { if (register) { dom.destroy(); this.showForm(false); } });
    form.querySelector("#f-tab-register")!.addEventListener("click", () => { if (!register) { dom.destroy(); this.showForm(true); } });
    const socialSoon = () => { (form.querySelector("#f-error") as HTMLDivElement).textContent = "Đăng nhập Google/Apple chưa mở trong bản thử nghiệm — dùng email trước nhé"; };
    form.querySelector("#f-google")!.addEventListener("click", socialSoon);
    form.querySelector("#f-apple")!.addEventListener("click", socialSoon);
    form.querySelector("#f-submit")!.addEventListener("click", () => { void this.submit(form, register); });
  }
  private async submit(form: HTMLDivElement, register: boolean): Promise<void> {
    const errorEl = form.querySelector("#f-error") as HTMLDivElement;
    const email = (form.querySelector("#f-email") as HTMLInputElement).value.trim();
    const password = (form.querySelector("#f-password") as HTMLInputElement).value;
    try {
      // Register is account-only now (email + password): the character name,
      // gender and look are chosen at the creation screen after login.
      if (register) {
        await network.request<RegisterResponse>("POST", "/auth/register", { email, password });
      }
      const login = await network.request<LoginResponse>("POST", "/auth/login", { email, password, deviceId: "web-dev" });
      network.setTokens(login);
      this.showServerSelect();
    } catch (e) {
      errorEl.textContent = e instanceof ApiClientError ? e.message : "Không kết nối được máy chủ";
    }
  }
  /** Server select (Tín's spec 2026-11-12, styled on his reference): the entry
   *  background stays; a dark bronze-rimmed bar shows the current server in
   *  green with "Nhấp đổi" on the right; the Start button sits below the bar.
   *  "Nhấp đổi" opens a panel: clusters in a vertical column on the left,
   *  that cluster's servers on the right (structure holds 100 servers/cluster).
   *  The game runs a single server today — the panel is real and ready for more. */
  private showServerSelect(): void {
    this.revealed = true;
    this.tapText?.destroy();
    this.children.getAll().filter(o => o.type === "DOMElement").forEach(o => o.destroy());
    const CLUSTERS = [
      { id: "cum-1", name: "Cụm 1", servers: [{ id: "aetheria", name: "Aetheria", note: "Máy chủ chính" }] },
    ];
    let cluster = CLUSTERS[0];
    let selected = cluster.servers[0];
    const wrap = document.createElement("div");
    wrap.className = "eidolith-server";
    wrap.innerHTML = `
      <div class="srv-bar" id="srv-bar"><span class="srv-name">${selected.name}</span><span class="srv-change">Nhấp đổi</span></div>
      <button id="srv-start">Bắt đầu</button>`;
    const barDom = this.add.dom(this.scale.width / 2, 452, wrap);
    barDom.setAlpha(0);
    this.tweens.add({ targets: barDom, alpha: 1, duration: 320, ease: "Sine.easeOut" });
    // --- cluster/server panel ---
    const panel = document.createElement("div");
    panel.className = "srv-panel";
    panel.id = "srv-panel";
    const renderPanel = () => {
      panel.innerHTML = `
        <div class="srv-p-head"><span class="srv-p-title">CHỌN MÁY CHỦ</span><button class="srv-close" id="srv-close"><i class="fa-solid fa-xmark"></i></button></div>
        <div class="srv-p-body">
          <div class="srv-clusters">${CLUSTERS.map(c => `<button class="srv-cluster${c.id === cluster.id ? " on" : ""}" data-cid="${c.id}">${c.name}</button>`).join("")}</div>
          <div class="srv-grid">${cluster.servers.map(s => `<div class="srv-item${s.id === selected.id ? " sel" : ""}" data-sid="${s.id}"><span class="srv-dot"></span><span>${s.name}<br /><span class="srv-note">${s.note}</span></span>${s.id === selected.id ? '<span class="srv-tag">Đang chọn</span>' : ""}</div>`).join("")}</div>
        </div>`;
      panel.querySelector("#srv-close")!.addEventListener("click", () => panelDom.setVisible(false));
      panel.querySelectorAll(".srv-cluster").forEach(btn => btn.addEventListener("click", () => {
        cluster = CLUSTERS.find(c => c.id === (btn as HTMLElement).dataset.cid) ?? cluster;
        renderPanel();
      }));
      panel.querySelectorAll(".srv-item").forEach(item => item.addEventListener("click", () => {
        selected = cluster.servers.find(s => s.id === (item as HTMLElement).dataset.sid) ?? selected;
        (wrap.querySelector(".srv-name") as HTMLSpanElement).textContent = selected.name;
        panelDom.setVisible(false);
      }));
    };
    renderPanel();
    const panelDom = this.add.dom(this.scale.width / 2, this.scale.height / 2, panel);
    panelDom.setVisible(false);
    wrap.querySelector("#srv-bar")!.addEventListener("click", () => { renderPanel(); panelDom.setVisible(true); });
    wrap.querySelector("#srv-start")!.addEventListener("click", () => { void this.enterWorld(); });
  }
  /** Loading state (Tín's spec 2026-11-12): the entry background stays, a
   *  progress bar runs near the bottom and a random gameplay tip shows under
   *  it. Progress follows the real entry steps (profile → connection → world). */
  private showLoading(): { set: (pct: number) => void; destroy: () => void } {
    this.children.getAll().filter(o => o.type === "DOMElement").forEach(o => o.destroy());
    const TIPS = [
      "Bấm vào Eidolon hoang để tự đi tới và bắt đầu thu phục.",
      "Cho Eidolon vào Vườn gắn kết ở Sanctuary để tăng Bond ngay cả khi bạn không online.",
      "Tiến hoá cần Lv.16 và 1 Evolution Core — Core rơi khi thắng trận và chắc chắn có ở boss Ancient Treant mỗi ngày.",
      "Nguyên tố khắc chế gây thêm 25% sát thương — xem vòng khắc chế trước khi đấu boss.",
      "Cổng thám hiểm ở Sanctuary cho Eidolon đi xa mang quà về.",
      "Đấu giao hữu với bạn bè không tính thưởng — thử đội hình thoải mái.",
      "Tab Thế giới trong khung chat nhắn được cho cả máy chủ.",
      "Bấm thẻ nhiệm vụ dưới thẻ nhân vật để xem nhiệm vụ — nhiệm vụ ngày làm mới mỗi ngày.",
    ];
    const tip = TIPS[Math.floor(Math.random() * TIPS.length)];
    const wrap = document.createElement("div");
    wrap.className = "load-wrap";
    wrap.innerHTML = `
      <div class="load-track"><div class="load-fill" id="load-fill"></div></div>
      <div class="load-row"><span>Đang vào game…</span><span id="load-pct">0%</span></div>
      <div class="load-tip" id="load-tip"><b>Mẹo:</b> ${tip}</div>`;
    const dom = this.add.dom(this.scale.width / 2, 592, wrap);
    const fill = wrap.querySelector("#load-fill") as HTMLDivElement;
    const pct = wrap.querySelector("#load-pct") as HTMLSpanElement;
    return {
      set: (p: number) => { fill.style.width = `${p}%`; pct.textContent = `${p}%`; },
      destroy: () => dom.destroy(),
    };
  }
  private async enterWorld(): Promise<void> {
    if (this.entering) return;
    this.entering = true;
    const ui = this.showLoading();
    ui.set(12);
    try {
      let profile = await network.request<PlayerProfile>("GET", "/player/me");
      ui.set(42);
      if (!profile.characterCreated) {
        // First entry: the creation screen (name + gender + hair + outfit)
        // gates the world until the character exists.
        ui.destroy();
        profile = await this.showCreation();
        const ui2 = this.showLoading();
        await this.connectAndStart(profile, ui2);
        return;
      }
      await this.connectAndStart(profile, ui);
    } catch {
      this.entering = false;
      network.clearTokens();
      if (this.scene.isActive()) { this.revealed = true; this.tapText?.destroy(); this.showForm(false); }
    }
  }
  private async connectAndStart(profile: PlayerProfile, ui: { set: (pct: number) => void; destroy: () => void }): Promise<void> {
    const snapshot = await network.connect();
    ui.set(76);
    ui.set(100);
    await new Promise(r => setTimeout(r, 420));
    this.scene.start("World", { profile, snapshot });
  }
  /** Character creation screen (approved mock, 2026-11-12): name with the
   *  no-special-characters rule, gender as icon-only cards, hairstyle + hair
   *  color + everyday outfits, live preview over the Ancient Grove backdrop. */
  private showCreation(): Promise<PlayerProfile> {
    return new Promise<PlayerProfile>((resolve) => {
      this.children.getAll().filter(o => o.type === "DOMElement").forEach(o => o.destroy());
      if (this.bgImage && this.textures.exists("creation_bg")) this.bgImage.setTexture("creation_bg");
      const st = { gender: "female" as GenderKey, style: APPEARANCE_UI.female.defStyle as string, color: "brown", outfit: "default" };
      const el = document.createElement("div");
      el.className = "eidolith-create";
      el.innerHTML = `
       <div class="c-flex">
        <div class="c-left"><img id="c-preview" alt="" /><div class="c-pname" id="c-pname">Nhân vật mới</div><div class="c-ptag" id="c-ptag"></div></div>
        <div class="c-right">
          <h2>TẠO NHÂN VẬT</h2>
          <div class="c-sub">Đặt tên và chọn diện mạo cho nhà thám hiểm của bạn</div>
          <div class="c-label">TÊN NHÂN VẬT</div>
          <input class="c-name" id="c-name" maxlength="20" placeholder="Nhập tên nhân vật" />
          <div class="c-note">3–20 ký tự, chỉ gồm chữ cái và số — không dùng ký tự đặc biệt.</div>
          <div class="c-err" id="c-error"></div>
          <div class="c-label">GIỚI TÍNH</div>
          <div class="c-genders" id="c-genders"></div>
          <div class="c-label">KIỂU TÓC</div>
          <div class="c-thumbs" id="c-styles"></div>
          <div class="c-label">MÀU TÓC</div>
          <div class="c-swatches" id="c-colors"></div>
          <div class="c-label">TRANG PHỤC</div>
          <div class="c-thumbs" id="c-outfits"></div>
          <button class="c-go" id="c-submit"><i class="fa-solid fa-play"></i>&nbsp; Bắt đầu hành trình</button>
        </div>
       </div>`;
      const dom = this.add.dom(this.scale.width / 2, this.scale.height / 2, el);
      dom.setAlpha(0);
      this.tweens.add({ targets: dom, alpha: 1, duration: 320, ease: "Sine.easeOut" });
      const nameInput = el.querySelector("#c-name") as HTMLInputElement;
      const errEl = el.querySelector("#c-error") as HTMLDivElement;
      let previewSeq = 0;
      const appearance = () => ({ avatarId: `wanderer_${st.gender}`, hairStyle: st.style, hairColor: st.color, outfit: st.outfit });
      const render = () => {
        const ui = APPEARANCE_UI[st.gender];
        const gName = st.gender === "female" ? "Nữ" : "Nam";
        el.querySelector("#c-genders")!.innerHTML = `
          <div class="c-gender${st.gender === "male" ? " on" : ""}" data-g="male"><span class="c-gicon m"><i class="fa-solid fa-mars"></i></span><span><span class="c-gname">Nam</span><br /><span class="c-gsub">Wanderer nam</span></span></div>
          <div class="c-gender${st.gender === "female" ? " on" : ""}" data-g="female"><span class="c-gicon f"><i class="fa-solid fa-venus"></i></span><span><span class="c-gname">Nữ</span><br /><span class="c-gsub">Wanderer nữ</span></span></div>`;
        el.querySelectorAll(".c-gender").forEach(card => card.addEventListener("click", () => {
          const g = (card as HTMLElement).dataset.g as GenderKey;
          if (g !== st.gender) { st.gender = g; st.style = APPEARANCE_UI[g].defStyle; st.outfit = "default"; render(); }
        }));
        el.querySelector("#c-styles")!.innerHTML = ui.styles.map(([id, name]) =>
          `<div class="c-th${st.style === id ? " on" : ""}" data-v="${id}"><img src="assets/chars/custom/hair-${st.gender}-${id}.png" alt="" /><span>${name}</span></div>`).join("");
        el.querySelectorAll("#c-styles .c-th").forEach(th => th.addEventListener("click", () => { st.style = (th as HTMLElement).dataset.v!; render(); }));
        el.querySelector("#c-colors")!.innerHTML = HAIR_COLORS.map(([id, name, hex]) =>
          `<div class="c-sw${st.color === id ? " on" : ""}" data-v="${id}"><i style="background:${hex}"></i><span>${name}</span></div>`).join("");
        el.querySelectorAll("#c-colors .c-sw").forEach(sw => sw.addEventListener("click", () => { st.color = (sw as HTMLElement).dataset.v!; render(); }));
        el.querySelector("#c-outfits")!.innerHTML = ui.outfits.map(([id, name]) =>
          `<div class="c-th${st.outfit === id ? " on" : ""}" data-v="${id}"><img src="${id === "default" ? `assets/chars/custom/hair-${st.gender}-${ui.defStyle}.png` : `assets/chars/custom/outfit-${st.gender}-${id}.png`}" alt="" /><span>${name}</span></div>`).join("");
        el.querySelectorAll("#c-outfits .c-th").forEach(th => th.addEventListener("click", () => { st.outfit = (th as HTMLElement).dataset.v!; render(); }));
        const styleName = ui.styles.find(([id]) => id === st.style)?.[1] ?? "";
        const colorName = HAIR_COLORS.find(([id]) => id === st.color)?.[1] ?? "";
        const outfitName = ui.outfits.find(([id]) => id === st.outfit)?.[1] ?? "";
        (el.querySelector("#c-pname") as HTMLDivElement).textContent = nameInput.value.trim() || "Nhân vật mới";
        (el.querySelector("#c-ptag") as HTMLDivElement).textContent = `${gName} · Tóc ${styleName.toLowerCase()} · ${colorName.toLowerCase()} · ${outfitName}`;
        const seq = ++previewSeq;
        void previewDataUrl(appearance()).then(url => {
          if (seq === previewSeq) (el.querySelector("#c-preview") as HTMLImageElement).src = url;
        }).catch(() => undefined);
      };
      nameInput.addEventListener("input", render);
      render();
      el.querySelector("#c-submit")!.addEventListener("click", () => {
        const name = nameInput.value.trim();
        if (!isValidUsername(name)) { errEl.textContent = "Tên nhân vật 3–20 ký tự, chỉ gồm chữ cái và số — không dùng ký tự đặc biệt"; return; }
        const body: CharacterCreateRequest = { displayName: name, ...appearance() };
        void network.request<PlayerProfile>("POST", "/player/character", body)
          .then(profile => { dom.destroy(); resolve(profile); })
          .catch((e: unknown) => { errEl.textContent = e instanceof ApiClientError ? e.message : "Không kết nối được máy chủ"; });
      });
    });
  }
}
