// Agents as people in a top-down 8-bit office. One office per machine; each agent sits at its own desk.
// Click a desk to go to that agent. Sprites are in sprites/ (generated: 24x20 pixel grids, shown at 3x).

import { View, div, image } from "gpui-kit";
import { v_flex, h_flex } from "gpui-base";
import { agents, machines, focused, run, theme, setAgentOrder, keys, nextCommand } from "herdr";

const DOS = "PxPlus IBM VGA 8x16";
const SPRITES = "mods/agents-office/sprites";
const SW = 24, SH = 20;
const WALLS = ["#3a6ea5", "#a5533a", "#3a8a5a", "#8a5aa5", "#a58a3a"];
const FLOOR_A = "#4a5578", FLOOR_B = "#525d84", FLOOR_HOVER = "#6a77a8";
const LED = { blocked: "#ff5d5d", done: "#5be37d", working: "#5ee7ff", idle: "#8a90b0" };
const RANK = { blocked: 4, done: 3, working: 2, idle: 1 };
const POSE = { working: "working", blocked: "blocked", done: "done" };

function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

// An agent on another machine has an address like `vps/t7`; this computer's are bare.
const machineOf = (a) => (a.address.includes("/") ? a.address.split("/")[0] : null);

export default class AgentsOffice extends View {
  init(_props, cx) {
    this.width = 268;
    // Folded offices (by machine name, "" for this computer), kept across restarts.
    let kept = [];
    try { kept = JSON.parse(localStorage.getItem("folded") ?? "[]"); } catch {}
    this.folded = new Set(kept);
    this.order = [];
    this.num = new Map();
    this.jump = new Map();
    // Keys "cmd-alt-N": "agents-office.jump-N" arrive here; N counts desks in the order they are drawn.
    cx.spawn(async () => {
      for (;;) {
        const m = /^jump-(\d+)$/.exec(await nextCommand());
        const a = m && this.order[+m[1] - 1];
        if (a) run("pane.focus", { pane: a.pane });
      }
    });
  }

  toggle(key, cx) {
    this.folded.has(key) ? this.folded.delete(key) : this.folded.add(key);
    try { localStorage.setItem("folded", JSON.stringify([...this.folded])); } catch {}
    cx.notify();
  }

  bubble(st) {
    const box = () => div().absolute().top(0).right(1).px(3).text_size(12).font_family(DOS).text_color("#1b1d2a");
    if (st === "working") return box().bg("#ffffff").min_w(18).text_center().frames([".", "..", "..."], 380);
    if (st === "blocked") return box().bg("#ff5d5d").text_color("#ffffff").loop("opacity", { from: 0.25, to: 1, period: 700 }).child("!");
    if (st === "done") return box().bg("#5be37d").child("OK");
    return box().bg("#c9cbe8").frames(["z", "zz", "zzz"], 800);
  }

  desk(a, scale, i, tinted) {
    const cw = SW * scale, ch = SH * scale;
    const st = POSE[a.status] ?? "idle";
    const h = hash(a.address), base = `${SPRITES}/${st}-${h % 6}-${(h >>> 3) % 3}`;
    const name = a.space_name || a.program?.name || a.address;
    const n = this.num.get(a.address), combo = this.jump.get(n);
    return v_flex().id(`ag-${a.address}`).w(cw + (scale > 1 ? 4 : 0)).flex_none().items_center().pb(scale > 1 ? 2 : 0)
      .border(scale > 1 ? 2 : 0).border_color(a.focused ? "#f5d442" : "#00000000")
      .bg(i % 2 ? FLOOR_A : FLOOR_B).cursor_pointer().hover((s) => s.bg(FLOOR_HOVER))
      .tooltip(`${name} · ${a.program?.name ?? "agent"} · ${a.status}${combo ? ` · ${combo}` : ""}`)
      .on_click(() => run("pane.focus", { pane: a.pane }))
      .child(div().relative().w(cw).h(ch).flex_none()
        .child(image(`${base}.svg`).w(cw).h(ch))
        .when(st === "working", (el) => el.child(image(`${base}-b.svg`).absolute().top(0).left(0).w(cw).h(ch).loop("opacity", { from: 0, to: 1, period: 520 })))
        .when(scale > 1, (el) => el.child(this.bubble(st)))
        .when(scale > 1 && Boolean(combo), (el) => el.child(div().absolute().top(0).left(0).px(3).bg("#1b1d2a").text_size(12).font_family(DOS).text_color("#f5d442").child(String(n)))))
      .when(scale > 1, (el) => el.child(div().w(cw).text_center().truncate().text_size(12).font_family(DOS).text_color("#e8ecff").child(name)));
  }

  vacant(scale, i) {
    const cw = SW * scale, ch = SH * scale;
    return v_flex().w(cw + (scale > 1 ? 4 : 0)).flex_none().items_center().pb(scale > 1 ? 2 : 0).bg(i % 2 ? FLOOR_A : FLOOR_B)
      .child(image(`${SPRITES}/empty.svg`).w(cw).h(ch).flex_none())
      .when(scale > 1, (el) => el.child(div().w(cw).text_center().text_size(12).font_family(DOS).text_color("#8a90b0").child("vacant")));
  }

  plant(scale) {
    return v_flex().w(SW * scale + (scale > 1 ? 4 : 0)).flex_none().items_center().justify_end().pb(scale > 1 ? 18 : 0)
      .child(image(`${SPRITES}/plant.svg`).w(8 * scale).h(10 * scale));
  }

  office(name, members, n, scale, cols) {
    const wall = WALLS[n % WALLS.length], key = name ?? "", open = !this.folded.has(key);
    const top = members.reduce((m, a) => ((RANK[a.status] ?? 0) > (RANK[m] ?? 0) ? a.status : m), null);
    const cells = members.length ? members.map((a, i) => this.desk(a, scale, i)) : [this.vacant(scale, 0)];
    if (cells.length % cols !== 0 || cells.length === 1) cells.push(this.plant(scale));
    const rows = [];
    for (let i = 0; i < cells.length; i += cols) rows.push(cells.slice(i, i + cols));
    return v_flex().id(`office-${name ?? "local"}`).w_full().flex_none().border(scale > 1 ? 3 : 2).border_color(wall).bg(FLOOR_A)
      .child(h_flex().id(`sign-${key}`).h(scale > 1 ? 22 : 14).flex_none().px(scale > 1 ? 6 : 2).gap(6).items_center().bg(wall)
        .cursor_pointer().hover((s) => s.opacity(0.85)).tooltip(open ? "Fold office" : "Unfold office")
        .on_click((_e, cx) => this.toggle(key, cx))
        .when(scale > 1, (el) => el
          .child(div().flex_none().text_size(16).font_family(DOS).text_color("#ffffff").child(open ? "[-]" : "[+]"))
          .child(div().truncate().text_size(16).font_family(DOS).text_color("#ffffff").child((name ?? "This computer").toUpperCase()))
          .child(div().flex_1())
          .child(div().w(10).h(8).flex_none().bg("#bcd9ff")).child(div().w(10).h(8).flex_none().bg("#bcd9ff"))
          .child(div().text_size(16).font_family(DOS).text_color("#ffffff").child(String(members.length))))
        .child(div().size(6).flex_none().bg(LED[top] ?? "#4b5170")))
      .when(open, (el) => el.child(v_flex().children(rows.map((r) => h_flex().justify_center().children(r)))));
  }

  render(cx) {
    const t = theme();
    const list = agents();
    const offices = new Map(machines().map((m) => [m.name ?? null, []]));
    for (const a of list) {
      const m = machineOf(a);
      if (!offices.has(m)) offices.set(m, []);
      offices.get(m).push(a);
    }
    this.order = [...offices.values()].flat();
    setAgentOrder(this.order.map((a) => a.address));
    // The desk number shows only when its key exists, so it is the actual hotkey and follows rebinding.
    this.num = new Map(this.order.map((a, i) => [a.address, i + 1]));
    this.jump = new Map();
    for (const k of keys()) {
      const m = /^agents-office\.jump-(\d+)$/.exec(k.action);
      if (m && !this.jump.has(+m[1])) this.jump.set(+m[1], k.keys);
    }
    const narrow = this.width < 160, scale = narrow ? 1 : 3;
    const cols = Math.max(1, Math.floor((this.width - 16 - 8) / (SW * scale + (scale > 1 ? 4 : 0))));
    return v_flex().id("agents-office").size_full().min_h(0).bg(t.chrome).border_t(1).border_color(t.border)
      .on_size_change((size, cx) => {
        if (Math.abs(size.width - this.width) > 0.5) { this.width = size.width; cx.notify(); }
      })
      .when(!narrow, (el) => el.child(h_flex().px(16).h(36).pt(12).pb(4).flex_none().items_center()
        .child(div().text_size(11.5).font_medium().text_color(t.dim).child("Agents"))))
      .child(v_flex().id("office-list").flex_1().min_h(0).p(narrow ? 3 : 8).gap(narrow ? 4 : 10).overflow_y_scrollbar()
        .children([...offices].map(([name, members], n) => this.office(name, members, n, scale, cols))));
  }
}
