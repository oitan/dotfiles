// Pick a theme. Type to filter, ↑/↓ and Enter to apply, Esc to leave.
import { View, div } from "gpui-kit";
import { v_flex, h_flex, InputState, Input } from "gpui-base";
import { themes, layouts, settings, run, theme, props, closeOverlay, setShared, appHome, readTextFile, writeTextFile } from "herdr";

export default class ThemePicker extends View {
  init(_props, cx) {
    this.filter = "";
    this.handle = cx.focus_handle();
    this.input = InputState.new({ placeholder: "Filter themes…" });
    this.input.on("change", (_e, cx) => { this.filter = this.input.value(); this.at = 0; cx.notify(); });
    this.input.on("submit", (_e, cx) => this.apply(this.list()[this.at], cx));
    this.input.focus();
    cx.timer.after(600, () => this.input.focus());
    const current = this.current();
    this.at = Math.max(0, this.list().findIndex((x) => x.name === current));
  }

  current() {
    const t = settings().theme;
    return typeof t === "string" ? t : null;
  }

  list() {
    const f = this.filter.toLowerCase();
    // A theme named like a layout (win98) belongs to that layout's own look.
    const own = new Set(layouts());
    return themes().filter((x) => !own.has(x.name) && x.name.toLowerCase().includes(f));
  }

  dismiss() { closeOverlay(props().overlay); }

  // The tab bar button reads this to tell the press that dismissed the popup from a press that opens it.
  async close() { setShared("theme-picker.closedAt", Date.now()); }

  // app.theme fills the light or dark half of the layout's theme by the theme's lightness, and the
  // window shows the half matching the appearance, so the appearance follows the pick.
  apply(x, cx) {
    if (!x) return;
    cx.spawn(async () => {
      try {
        const path = `${appHome()}/settings.json`, text = await readTextFile(path);
        const cfg = JSON.parse(text ?? "{}"), appearance = x.light ? "light" : "dark";
        if (cfg.appearance !== appearance) await writeTextFile(path, JSON.stringify({ ...cfg, appearance }, null, 2), text);
      } catch {}
      run("app.theme", { name: x.name });
      this.dismiss();
    });
  }

  render(cx) {
    const t = theme(), list = this.list(), current = this.current();
    if (this.at >= list.length) this.at = Math.max(0, list.length - 1);
    return v_flex().id("theme-picker").track_focus(this.handle).w_full().min_h(0).p(16).gap(10).bg(t.popover).text_size(13)
      .on_key_down((e, cx) => {
        const k = e.key;
        if (k === "escape") return this.dismiss();
        if (k === "down") this.at = (this.at + 1) % Math.max(1, list.length);
        else if (k === "up") this.at = (this.at + list.length - 1) % Math.max(1, list.length);
        else return;
        cx.stop_propagation(); cx.notify();
      })
      .child(h_flex().items_center().child(div().flex_1().text_size(15).font_semibold().text_color(t.foreground).child("Theme"))
        .child(div().id("theme-esc").px(6).py(2).rounded(5).text_size(11).text_color(t.dim).cursor_pointer().hover((s) => s.bg(t.hover).text_color(t.foreground)).on_click(() => this.dismiss()).child("Esc")))
      .child(h_flex().h(34).flex_none().px(10).items_center().rounded(9).border_1().border_color(t.accent).bg(t.background)
        .child(Input.new(this.input).flex_1().h_full().text_size(12.8).text_color(t.foreground)))
      .child(v_flex().id("theme-list").flex_1().min_h(0).overflow_y_scroll().gap(2).children(list.map((x, i) => {
        const c = x.colors ?? {};
        return h_flex().id(`theme-${x.name}`).h(34).flex_none().px(10).gap(10).items_center().rounded(8).cursor_pointer()
          .bg(i === this.at ? t.selected : t.popover).hover((s) => s.bg(t.hover)).on_click((_e, cx) => this.apply(x, cx))
          .child(h_flex().flex_none().rounded(4).overflow_hidden().border_1().border_color(t.border)
            .children([c.background, c.ansi1, c.ansi2, c.ansi3, c.ansi4, c.ansi5].map((col) => div().w(12).h(18).bg(col ?? t.dim))))
          .child(div().flex_1().min_w(0).truncate().text_color(t.foreground).child(x.name))
          .when(x.light, (e) => e.child(div().text_size(11).text_color(t.dim).child("light")))
          .when(x.name === current, (e) => e.child(div().text_color(t.accent).child("✓")));
      })).when(!list.length, (e) => e.child(div().p(8).text_color(t.dim).child("No themes match"))));
  }
}
