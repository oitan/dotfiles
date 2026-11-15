// Send a pane, or a whole tab (scope "tab", from my-menu), to another space. Lists every space on the pane's machine with a "New tab" row and a row per tab; the terminal keeps
// running, parked, then shown in that space as its own tab or split beside the panes of the tab you picked.

import { View, div } from "gpui-kit";
import { v_flex, h_flex } from "gpui-base";
import { run, theme, props as hostProps, closeOverlay, exec, appHome, notify } from "herdr";
import { targets, HEAD, ITEM } from "./targets.js";

const props = () => hostProps() ?? {};

export default class PaneMove extends View {
  close() { closeOverlay(props().overlay); }

  // send.sh does the moving (park, show the space, keep), so it finishes even after this popup is closed; the popup
  // says "Moving…" until it is done. With no tab the terminals become a new tab; with one, they split beside its panes.
  send(space, tab, cx) {
    const terminals = props().terminals ?? [props().terminal];
    this.moving = true;
    cx.notify();
    exec("bash", [`${appHome()}/mods/pane-move/send.sh`, space.id, tab?.id ?? "-", ...terminals], { timeout: 60000 })
      .catch(() => notify({ title: "Could not move", body: "Herdr did not accept the move", level: "error" }))
      .finally(() => this.close());
  }

  item(t, id, label, onClick, icon) {
    return h_flex().id(id).h(ITEM).flex_none().px(8).gap(8).rounded(7).items_center().text_color(t.foreground).cursor_pointer()
      .hover((s) => s.bg(t.hover)).on_click(onClick)
      .child(icon ?? div().w(12).flex_none())
      .child(div().flex_1().min_w(0).truncate().child(label));
  }

  render() {
    const t = theme(), p = props();
    if (this.moving) return v_flex().w_full().h_full().p(5).bg(t.popover).child(div().px(8).py(8).text_size(12).text_color(t.dim).child("Moving…"));
    if (p.mode === "space") {
      const list = targets(p);
      return v_flex().w_full().h_full().p(5).bg(t.popover).text_size(12.8)
        .child(div().px(8).pt(4).pb(6).text_size(11).text_color(t.dim).child(p.scope === "tab" ? "Send tab to space" : "Send to space"))
        .child(v_flex().id("send-spaces").flex_1().min_h(0).overflow_y_scroll()
          .children(list.flatMap(({ space, tabs }) => [
            h_flex().h(HEAD).flex_none().px(8).items_end().pb(2).gap(6).text_size(11).text_color(t.dim)
              .child(div().min_w(0).truncate().child(space.name))
              .when(Boolean(space.machine), (el) => el.child(div().flex_none().child(space.machine))),
            this.item(t, `new-${space.id}`, "New tab", (_e, cx) => this.send(space, null, cx), div().w(12).flex_none().text_color(t.accent).child("+")),
            ...tabs.map((tab) => this.item(t, `tab-${tab.id}`, tab.name, (_e, cx) => this.send(space, tab, cx))),
          ]))
          .when(!list.length, (el) => el.child(div().px(8).py(6).text_size(12).text_color(t.dim).child("No spaces on this machine."))));
    }
    return div();
  }
}
