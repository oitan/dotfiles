import { View, div, svg, image } from "gpui-kit";
import { h_flex, ScrollHandle } from "gpui-base";
import { spaces, panes, run, openOverlay, theme, window, shared, layout, settings, nextCommand, keys } from "herdr";

const GLYPH = { ctrl: "⌃", cmd: "⌘", alt: "⌥", shift: "⇧" }, WORDS = { ctrl: "Ctrl", cmd: "Cmd", alt: "Alt", shift: "Shift" };

// A key binding for an action, from the live key table: its modifiers and its key ("cmd-ctrl-[" -> ["cmd","ctrl"], "[").
function binding(table, action) {
  const k = table.find((x) => x.action === action);
  if (!k) return null;
  const parts = k.keys.split("-"), key = parts.pop();
  return key ? { mods: parts, key } : null;
}

// The hint beside the panel buttons: "⌘⌃B · ⌘⌃[ ]" (show/hide, then previous and next panel tab), each part
// shown only when its keys are bound (the bracket pair needs one shared modifier). Follows rebinding because
// it reads the live key table.
function panelKeyHint() {
  const table = keys(), toggle = binding(table, "layout.toggle:panel"), prev = binding(table, "my-tabs.panel-prev"), next = binding(table, "my-tabs.panel-next");
  const sym = (b) => b.mods.map((m) => GLYPH[m] ?? m).join(""), words = (b, key) => [...b.mods.map((m) => WORDS[m] ?? m), key].join("+");
  const text = [], tip = [];
  if (toggle) { text.push(`${sym(toggle)}${toggle.key.toUpperCase()}`); tip.push(`${words(toggle, toggle.key.toUpperCase())}: show or hide the panel`); }
  if (prev && next && prev.mods.join() === next.mods.join()) {
    text.push(`${sym(prev)}${prev.key} ${next.key}`); tip.push(`${words(prev, `${prev.key} / ${next.key}`)}: previous / next panel`);
  }
  return text.length ? { text: text.join(" · "), tip: tip.join(" · ") } : null;
}

function find(node, id) {
  if (node?.id === id) return node;
  for (const child of node?.children ?? []) {
    const found = find(child, id);
    if (found) return found;
  }
  return null;
}

// The right panel stacks: each of these blocks is shown or hidden on its own, and the panel itself is shown while any is.
const PANELS = ["files", "changes", "prs", "codexbar", "spec"];
function visiblePanels(root) {
  const panel = find(root, "panel");
  if (!panel || panel.hidden) return [];
  return PANELS.filter((id) => { const n = find(root, id); return n && !n.hidden; });
}
function showPanels(ids) {
  for (const id of PANELS) run(ids.includes(id) ? "layout.show" : "layout.hide", { id });
  run(ids.length ? "layout.show" : "layout.hide", { id: "panel" });
}

export default class Tabs extends View {
  init(_props, cx) {
    this.pressed = null;
    this.scroll = ScrollHandle.new();
    this.panels = JSON.parse(localStorage.getItem("panels") ?? "{}");
    // Keys "my-tabs.panel-next" / "my-tabs.panel-prev" show the right panel's panels one at a time.
    cx.spawn(async () => {
      for (;;) {
        const step = { "panel-next": 1, "panel-prev": -1 }[await nextCommand()];
        if (step) this.cyclePanel(step);
      }
    });
  }

  // The next or previous panel, wrapping around, shown alone; a hidden panel just opens as it was.
  cyclePanel(step) {
    const root = layout(), panel = find(root, "panel");
    const enabled = [...new Set([...(shared("workspace.panels") ?? ["files", "changes"]), "prs", "codexbar", "spec"])];
    const order = PANELS.filter((id) => enabled.includes(id));
    if (!panel || !order.length) return;
    if (!panel.hidden) {
      const at = order.indexOf(visiblePanels(root)[0]);
      showPanels([order[((at < 0 ? 0 : at) + step + order.length) % order.length]]);
    } else run("layout.show", { id: "panel" });
  }

  // The side panel is remembered per space: switching shows that space's panels
  // (closed if it never had any), and opening, closing or stacking one records it.
  syncPanel(space, root, enabled) {
    if (!space) return;
    const now = visiblePanels(root).filter((id) => enabled.includes(id));
    const same = (a, b) => a.join() === b.join();
    if (space.id !== this.space) {
      const first = this.space === undefined;
      this.space = space.id; this.pending = null;
      if (!(first && !(space.id in this.panels))) {
        const stored = [].concat(this.panels[space.id] ?? []), want = stored.filter((id) => enabled.includes(id));
        if (!same(want, now)) {
          this.pending = { want, until: Date.now() + 1000 };
          showPanels(want);
          return;
        }
      }
    }
    // Until the restore lands (or something else won), the old state isn't a choice.
    if (this.pending) {
      if (!same(this.pending.want, now) && Date.now() < this.pending.until) return;
      this.pending = null;
    }
    if (same([].concat(this.panels[space.id] ?? []), now)) return;
    this.panels[space.id] = now;
    localStorage.setItem("panels", JSON.stringify(this.panels));
  }

  render() {
    const t = theme();
    const space = spaces().find(p => p.active);
    const shown = space?.tabs ?? [];
    const active = shown.findIndex(tab => tab.active);
    const selected = shown[active]?.id;
    if (selected !== this.selected || active !== this.selectedIndex) {
      this.selected = selected;
      this.selectedIndex = active;
      if (active >= 0) this.scroll.scroll_to_item(active);
    }
    const panelHint = panelKeyHint();
    const stop = (_e, cx) => cx.stop_propagation();
    const button = (id, label, action) => div().id(id).size(26).flex_none().flex().items_center().justify_center().rounded(6).text_color(t.dim).hover(s => s.bg(t.hover).text_color(t.foreground))
      .on_mouse_down("left", stop).on_click(action).child(label);
    const item = (c, i) => {
      const program = panes().find(p => p.tab === c.id && p.program?.agent)?.program ?? panes().find(p => p.tab === c.id)?.program;
      const name = /^tb\d+$/.test(c.name) ? program?.name ?? "Terminal" : c.name;
      return h_flex().id(`tab-${c.id}`).h(29).px(10).gap(7).rounded(7).items_center().flex_none().text_size(12.8)
        // A rename or status dot on this or an earlier tab can push the active one out.
        .when(i <= active, el => el.on_size_change((_size, cx) => { this.scroll.scroll_to_item(active); cx.notify(); }))
        .border(1).border_color(c.active ? t.border : t.chrome).bg(c.active ? t.raised : t.chrome).text_color(c.active ? t.foreground : t.muted)
        .hover(s => s.bg(t.hover))
        .on_mouse_down("left", (e, cx) => { cx.stop_propagation(); this.pressed = i; if (e.click_count === 2) run("tab.rename", { id: c.id }); })
        .on_mouse_up("left", () => {
          const from = this.pressed; this.pressed = null;
          if (from !== null && from !== i) run("tab.move", { id: shown[from].id, index: space.tabs.findIndex(x => x.id === c.id) + 1 });
          else run("tab.select", { id: c.id });
        })
        .on_mouse_down("right", (_e, cx) => { cx.stop_propagation(); openOverlay({ mod: "my-menu", kind: "popup", width: 220, props: { tab: "tab", target: { id: c.id, space: space.id } } }); })
        .when(Boolean(program?.icon), el => el.child(program.tint ? svg(program.icon).size(14).text_color(t.muted) : image(program.icon).size(14)))
        .child(div().max_w(170).truncate().child(c.zoomed ? `${name} Z` : name))
        .when(c.status === "working", el => el.child(svg("mods/workspace-chrome/spinner.svg").size(12).flex_none().text_color(t.working).spin(900)))
        .when(c.status === "blocked" || c.status === "done", el => el.child(div().size(6).rounded(3).bg(t[c.status])))
        .when(c.active, el => el.child(div().id(`close-${c.id}`).text_color(t.dim).on_mouse_down("left", stop).on_click((_e, cx) => { cx.stop_propagation(); run("tab.close", { id: c.id }); }).child(svg("mods/pane/close.svg").size(12))));
    };
    const root = layout(), sidebar = find(root, "sidebar"), w = window();
    // Old saved rails and a dragged-narrow sidebar can be smaller than the window buttons.
    const lightsPadding = w?.platform === "macos" && w.titlebar === "none" && !w.fullscreen && root?.traffic_lights
      ? Math.max(10, (root.traffic_lights[0] + 64) / settings().zoom - (sidebar?.hidden ? 0 : sidebar?.size?.px ?? 0))
      : 10;
    const enabled = [...new Set([...(shared("workspace.panels") ?? ["files", "changes"]), "prs", "codexbar", "spec"])];
    const open = visiblePanels(root);
    this.syncPanel(space, root, enabled);
    const panelButton = (id, label, icon) => {
      const on = open.includes(id);
      return h_flex().id(`panel-${id}`).h(26).px(8).gap(5).flex_none().items_center().rounded(6)
        .text_size(12).bg(on ? t.selected : t.chrome).text_color(on ? t.foreground : t.muted)
        .hover(s => s.bg(t.hover)).on_mouse_down("left", stop)
        .on_click(() => showPanels(PANELS.filter((x) => (x === id ? !on : open.includes(x))))).child(svg(icon).size(14)).child(label);
    };
    return h_flex().size_full().min_w(0).px(10).pl(lightsPadding).gap(3).items_center().bg(t.chrome).border_b(1).border_color(t.border)
      .on_mouse_up("left", () => { this.pressed = null; })
      .on_scroll_wheel(e => { if (Math.abs(e.delta.y) >= 1) run(e.delta.y > 0 ? "tab.prev" : "tab.next"); })
      .child(h_flex().id("tab-scroll").flex_1().min_w(0).h_full().items_center().gap(3).overflow_x_scrollbar().track_scroll(this.scroll)
        .on_size_change((_size, cx) => { if (active >= 0) { this.scroll.scroll_to_item(active); cx.notify(); } })
        .children(shown.map(item)))
      .child(button("tab-new", "+", () => openOverlay({ mod: "new-menu", kind: "popup", width: 250, height: 512 })))
      .when(Boolean(panelHint), el => el.child(div().id("panel-keys").flex_none().mr(2).text_size(10.5).text_color(t.dim).tooltip(panelHint.tip).child(panelHint.text)))
      .when(enabled.includes("files"), el => el.child(panelButton("files", "Files", "mods/files/file.svg")))
      .when(enabled.includes("changes"), el => el.child(panelButton("changes", "Changes", "mods/changes/changes.svg")))
      .when(enabled.includes("prs"), el => el.child(panelButton("prs", "PRs", "mods/prs/pr.svg")))
      .when(enabled.includes("codexbar"), el => el.child(panelButton("codexbar", "Codex", "mods/codexbar/gauge.svg")))
      .when(enabled.includes("spec"), el => el.child(panelButton("spec", "Spec", "mods/spec-progress/list.svg")))
      .child(h_flex().id("theme").h(26).px(7).gap(5).flex_none().items_center().rounded(6).text_size(12).text_color(t.dim)
        .hover(s => s.bg(t.hover).text_color(t.foreground)).on_mouse_down("left", stop).on_click(() => run("mod.open", { name: "theme-picker" }))
        .child(svg("mods/my-tabs/palette.svg").size(15).flex_none())
        .when(typeof settings().theme === "string", el => el.child(div().child(settings().theme))))
      .when(w?.buttons, el => el.child(button("minimize", w.platform === "windows" ? svg("mods/my-tabs/win-min.svg").size(16) : "−", () => run("window.minimize")))
        .child(button("maximize", w.platform === "windows" ? svg(`mods/my-tabs/${w.maximized ? "win-restore" : "win-max"}.svg`).size(16) : "□", () => run("window.maximize")))
        .child(button("close-window", w.platform === "windows" ? svg("mods/my-tabs/win-close.svg").size(16) : svg("mods/pane/close.svg").size(13), () => run("window.close"))));
  }
}
