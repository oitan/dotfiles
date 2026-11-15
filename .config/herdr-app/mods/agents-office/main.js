// Agents as people in a top-down 8-bit office. One office per machine; each agent sits at its own desk.
// Click a desk to go to that agent. Sprites are in sprites/ (generated: 24x20 pixel grids, shown at 3x).

import { View, div, image, svg } from "gpui-kit";
import { v_flex, h_flex } from "gpui-base";
import { agents, machines, focused, run, theme, setAgentOrder, keys, nextCommand, openOverlay, spaces, shared, setShared, layout, hc, exec, notify } from "herdr";
import { listRows, groups, SNOOZED, UNREAD, ARCHIVED, FILTER, AUTOSETTLE } from "./list.js";

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

function findNode(node, id) {
  if (node?.id === id) return node;
  for (const child of node?.children ?? []) {
    const found = findNode(child, id);
    if (found) return found;
  }
  return null;
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
    this.hovered = null;
    this.lastFocused = null;
    // The list's Working, Snoozed, Settled and Archived sections (open or folded), kept across restarts.
    let open = {};
    try { open = JSON.parse(localStorage.getItem("sections") ?? "{}"); } catch {}
    this.open = { working: open.working !== false, snoozed: Boolean(open.snoozed), settled: Boolean(open.settled), archived: Boolean(open.archived) }; // Working starts open
    // When each agent went idle (for auto-settle), kept across restarts: { address: { s: state, at: ms } }.
    try { this.idle = JSON.parse(localStorage.getItem("idle") ?? "{}"); } catch { this.idle = {}; }
    // Keys "cmd-alt-N": "agents-office.jump-N" arrive here; N counts desks (or list cards) in the order shown.
    // "view-office", "view-list" and "view-toggle" switch the view; "regen-<address>" regenerates that agent's title.
    cx.spawn(async () => {
      for (;;) {
        const c = await nextCommand(), m = /^jump-(\d+)$/.exec(c), r = /^regen-(.+)$/.exec(c);
        const a = m && this.order[+m[1] - 1];
        if (a) run("pane.focus", { pane: a.pane });
        else if (r) this.regenerate(r[1]);
        else if (/^view-(office|list|toggle)$/.test(c)) setShared("agents.view", c === "view-toggle" ? (shared("agents.view") === "list" ? "office" : "list") : c.slice(5));
      }
    });
    cx.timer.every(15000, (cx) => this.wake(cx));
    cx.timer.every(60000, () => this.autoSettle());
    cx.timer.after(8000, () => this.autoSettle());
  }

  // Asks Codex (the one CLI that is signed in for scripts here) for a short title from the agent's terminal text, and
  // renames its tab to it. Slow (a few seconds to half a minute), so it posts a toast first and another when done.
  async regenerate(address) {
    const a = agents().find((x) => x.address === address);
    if (!a) return;
    notify({ title: "Regenerating title…", body: a.space_name, level: "info", timeout: 4000 });
    try {
      const read = await hc(["read", address, "--lines", "160"]);
      const screen = (read.stdout ?? "").trim();
      if (read.code !== 0 || !screen) throw new Error("couldn't read that terminal");
      const prompt = "You name coding-agent sessions. Below is terminal text from one session. Reply with a title of 3 to 7 words "
        + "naming the task being worked on: no quotes, no trailing punctuation, nothing else.\n\nTerminal text:\n" + screen.slice(-8000);
      const r = await exec("sh", ["-c", 'f=$(mktemp); codex exec --ephemeral --skip-git-repo-check -s read-only -c model_reasoning_effort=low -o "$f" "$1" >/dev/null 2>&1; cat "$f"; rm -f "$f"', "sh", prompt], { timeout: 120000 });
      const title = ((r.stdout ?? "").split("\n").map((l) => l.trim()).find(Boolean) ?? "").replace(/^["'`*]+|["'`*.]+$/g, "").slice(0, 60);
      if (!title) throw new Error("no title came back");
      run("tab.rename", { id: a.tab, name: title });
      notify({ title: "Thread renamed", body: title, level: "success", timeout: 5000 });
    } catch (e) {
      notify({ title: "Couldn't regenerate the title", body: String(e?.message ?? e), level: "error", timeout: 8000 });
    }
  }

  // Settles tabs whose agents have all been idle for the set number of days (shared agents.autosettle, 3 when never
  // set, 0 = off). Never a pinned, snoozed or focused agent. An agent's idle clock starts when we see it go idle, or the
  // first time we see it (from Herdr's last change in its tab, else now), so a restart doesn't settle everything.
  autoSettle() {
    const now = Date.now(), tabs = new Map(spaces().flatMap((s) => s.tabs).map((tab) => [tab.id, tab])), list = agents();
    let dirty = false;
    for (const a of list) {
      const state = a.status === "done" ? "idle" : a.status, seen = this.idle[a.address];
      if (seen?.s === state) continue;
      this.idle[a.address] = { s: state, at: seen ? now : (tabs.get(a.tab)?.changed_at ?? now) };
      dirty = true;
    }
    const listed = new Set(list.map((a) => a.address));
    for (const [address, v] of Object.entries(this.idle)) if (!listed.has(address) && now - v.at > 30 * 864e5) { delete this.idle[address]; dirty = true; }
    if (dirty) try { localStorage.setItem("idle", JSON.stringify(this.idle)); } catch {}
    const days = shared(AUTOSETTLE) ?? 3;
    if (!days) return;
    const snoozed = shared(SNOOZED) ?? {}, byTab = new Map();
    for (const a of list) byTab.set(a.tab, [...(byTab.get(a.tab) ?? []), a]);
    for (const [id, members] of byTab) {
      if (tabs.get(id)?.settled) continue;
      const stale = members.every((a) => !a.pinned && !a.focused && (snoozed[a.address] ?? 0) <= now && this.idle[a.address]?.s === "idle" && now - this.idle[a.address].at >= days * 864e5);
      if (stale) run("tab.settle", { id });
    }
  }

  // Snoozes that ran out go away (the list re-renders and the agent is back among the cards).
  wake(cx) {
    const snoozed = shared(SNOOZED) ?? {}, now = Date.now(), live = Object.fromEntries(Object.entries(snoozed).filter(([, until]) => until > now));
    if (Object.keys(live).length !== Object.keys(snoozed).length) this.setSnoozed(live);
    // An archive mark only holds while the tab stays settled; once it is back (shown, or needing you) the mark goes.
    const archived = shared(ARCHIVED) ?? {}, tabs = new Map(spaces().flatMap((sp) => sp.tabs).map((tab) => [tab.id, tab])), listed = new Map(agents().map((x) => [x.address, x]));
    const kept = Object.fromEntries(Object.entries(archived).filter(([address]) => !listed.has(address) || tabs.get(listed.get(address).tab)?.settled));
    if (Object.keys(kept).length !== Object.keys(archived).length) this.setArchived(kept);
    cx.notify();
  }

  setSnoozed(map) { setShared(SNOOZED, map); }
  setArchived(map) { setShared(ARCHIVED, map); }
  setUnread(address, on) {
    const all = { ...(shared(UNREAD) ?? {}) };
    if (on) all[address] = true; else delete all[address];
    setShared(UNREAD, all);
  }
  setFilter(filter) { setShared(FILTER, filter); }

  toggleSection(key, cx) {
    this.open[key] = !this.open[key];
    try { localStorage.setItem("sections", JSON.stringify(this.open)); } catch {}
    cx.notify();
  }

  toggle(key, cx) {
    this.folded.has(key) ? this.folded.delete(key) : this.folded.add(key);
    try { localStorage.setItem("folded", JSON.stringify([...this.folded])); } catch {}
    cx.notify();
  }

  // The hint beside the "Agents" label, from the live key table: the number-jump keys ("⌘⌥1–9") and the
  // previous/next keys ("⌘[ ]"), each shown only when bound with one shared modifier. Follows rebinding.
  keyHint(table) {
    const glyph = { ctrl: "⌃", cmd: "⌘", alt: "⌥", shift: "⇧" }, word = { ctrl: "Ctrl", cmd: "Cmd", alt: "Alt", shift: "Shift" };
    const split = (keys) => { const p = keys.split("-"), key = p.pop(); return { mods: p, key }; };
    const sym = (mods) => mods.map((m) => glyph[m] ?? m).join(""), words = (mods, key) => [...mods.map((m) => word[m] ?? m), key].join("+");
    const text = [], tip = [];
    const nums = [...this.jump.keys()].sort((a, b) => a - b);
    const prefixes = new Set(nums.map((n) => this.jump.get(n).slice(0, -String(n).length)));
    if (nums.length && prefixes.size === 1) {
      const mods = [...prefixes][0].split("-").filter(Boolean), range = nums.length > 1 ? `${nums[0]}–${nums.at(-1)}` : String(nums[0]);
      text.push(sym(mods) + range); tip.push(`${words(mods, range)}: jump to an agent`);
    }
    const prev = table.find((x) => x.action === "agent.prev"), next = table.find((x) => x.action === "agent.next");
    if (prev && next) {
      const a = split(prev.keys), b = split(next.keys);
      if (a.key && b.key && a.mods.join() === b.mods.join()) {
        text.push(`${sym(a.mods)}${a.key} ${b.key}`); tip.push(`${words(a.mods, `${a.key} / ${b.key}`)}: previous / next agent`);
      }
    }
    return text.length ? { text: text.join(" · "), tip: tip.join(" · ") } : null;
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

  // The plant starts a new agent for this office's machine (a picker for the agent and the project).
  plant(scale, i, name) {
    const key = name ?? "";
    return v_flex().id(`plant-${key}`).w(SW * scale + (scale > 1 ? 4 : 0)).flex_none().items_center().justify_end().pb(scale > 1 ? 2 : 0)
      .bg(i % 2 ? FLOOR_A : FLOOR_B).cursor_pointer().hover((s) => s.bg(FLOOR_HOVER))
      .tooltip(`New agent${name ? ` on ${name}` : ""} in a new space`)
      .on_click(() => openOverlay({ mod: "agent-launcher", kind: "window", key: "agent-launcher", width: 420, height: 520, props: { machine: name } }))
      .child(div().h(SH * scale - (scale > 1 ? 2 : 0)).flex().items_end().justify_center().pb(scale > 1 ? 6 : 0)
        .child(image(`${SPRITES}/plant.svg`).w(8 * scale).h(10 * scale)))
      .when(scale > 1, (el) => el.child(div().w(SW * scale).text_center().text_size(12).font_family(DOS).text_color("#bcd9ff").child("+ agent")));
  }

  office(name, members, n, scale, cols) {
    const wall = WALLS[n % WALLS.length], key = name ?? "", open = !this.folded.has(key);
    const top = members.reduce((m, a) => ((RANK[a.status] ?? 0) > (RANK[m] ?? 0) ? a.status : m), null);
    const cells = members.length ? members.map((a, i) => this.desk(a, scale, i)) : [this.vacant(scale, 0)];
    cells.push(this.plant(scale, cells.length, name));
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
    const narrow = this.width < 160, view = narrow ? "office" : (shared("agents.view") ?? "office");
    const now = Date.now(), snoozed = shared(SNOOZED) ?? {};
    const tabs = new Map(spaces().flatMap((s) => s.tabs).map((tab) => [tab.id, tab]));
    const archived = shared(ARCHIVED) ?? {}, filter = shared(FILTER) ?? null;
    const g = view === "list" ? groups(filter ? list.filter((a) => a.space === filter.space) : list, tabs, snoozed, now, archived) : null;
    // Switching to an agent reads it: its unread mark goes when it becomes the focused one (not while it already is,
    // so marking the agent you are looking at stays until you leave and come back).
    const unread = shared(UNREAD) ?? {}, now_focused = list.find((a) => a.focused)?.address ?? null;
    if (now_focused && now_focused !== this.lastFocused && unread[now_focused]) {
      const rest = { ...unread }; delete rest[now_focused];
      cx.timer.after(0, () => setShared(UNREAD, rest));
    }
    this.lastFocused = now_focused;
    // The numbers (and the jump keys) follow what is drawn: desks office by office, or the list's active cards.
    // The working agents are numbered only while their section is open, like the cards above them.
    this.order = g ? [...g.active, ...(this.open.working ? g.working : [])] : [...offices.values()].flat();
    setAgentOrder((g ? [...g.active, ...g.working, ...g.asleep, ...g.settled, ...g.shelved] : this.order).map((a) => a.address));
    // The desk number shows only when its key exists, so it is the actual hotkey and follows rebinding.
    this.num = new Map(this.order.map((a, i) => [a.address, i + 1]));
    this.jump = new Map();
    const table = keys();
    for (const k of table) {
      const m = /^agents-office\.jump-(\d+)$/.exec(k.action);
      if (m && !this.jump.has(+m[1])) this.jump.set(+m[1], k.keys);
    }
    const hint = this.keyHint(table);
    // The spaces block can be hidden (layout.toggle:spaces); while it is, a button here brings it back.
    const spacesHidden = Boolean(findNode(layout(), "spaces")?.hidden);
    const spacesKey = table.find((x) => x.action === "layout.toggle:spaces")?.keys;
    const scale = narrow ? 1 : 3;
    const cols = Math.max(1, Math.floor((this.width - 16 - 8) / (SW * scale + (scale > 1 ? 4 : 0))));
    return v_flex().id("agents-office").size_full().min_h(0).bg(t.chrome).border_t(1).border_color(t.border)
      .on_size_change((size, cx) => {
        if (Math.abs(size.width - this.width) > 0.5) { this.width = size.width; cx.notify(); }
      })
      .when(!narrow, (el) => el.child(h_flex().px(16).h(36).pt(12).pb(4).flex_none().items_center().gap(6)
        .child(h_flex().flex_1().min_w(0).gap(8).items_baseline()
          .child(div().flex_none().text_size(11.5).font_medium().text_color(t.dim).child("Agents"))
          .when(Boolean(hint), (el) => el.child(div().id("agent-keys").min_w(0).truncate().text_size(10.5).text_color(t.dim).tooltip(hint.tip).child(hint.text))))
        .when(spacesHidden, (el) => el.child(this.headerButton("show-spaces", svg("mods/workspace-chrome/panel-left.svg").size(13), false, t,
          `Show spaces${spacesKey ? ` (${spacesKey.split("-").map((k) => k[0].toUpperCase() + k.slice(1)).join("+")})` : ""}`, () => run("layout.toggle", { id: "spaces" }))))
        .when(view === "list", (el) => el.child(this.headerButton("new-agent", svg("mods/workspace-chrome/plus.svg").size(13), false, t, "New agent",
          () => openOverlay({ mod: "agent-launcher", kind: "window", key: "agent-launcher", width: 420, height: 520, props: {} }))))
        .child(this.headerButton("view-office", svg("mods/workspace-chrome/monitor.svg").size(13), view === "office", t, "Office view", () => setShared("agents.view", "office")))
        .child(this.headerButton("view-list", svg("mods/workspace-chrome/layers.svg").size(13), view === "list", t, "List view", () => setShared("agents.view", "list")))))
      .when(view === "list", (el) => el.child(v_flex().id("agent-list").flex_1().min_h(0).px(8).pb(8).gap(4).overflow_y_scrollbar()
        .children(listRows(g, { t, now, tabs, colors: shared("space.colors") ?? {}, num: this.num, jump: this.jump, host: this, snoozed, unread, archived, filter }))))
      .when(view !== "list", (el) => el.child(v_flex().id("office-list").flex_1().min_h(0).p(narrow ? 3 : 8).gap(narrow ? 4 : 10).overflow_y_scrollbar()
        .children([...offices].map(([name, members], n) => this.office(name, members, n, scale, cols)))));
  }

  headerButton(id, icon, on, t, tip, action) {
    return div().id(id).size(22).flex_none().flex().items_center().justify_center().rounded(6).cursor_pointer().tooltip(tip)
      .text_color(on ? t.foreground : t.dim).bg(on ? t.selected : t.chrome).hover((s) => s.bg(t.hover).text_color(t.foreground))
      .on_click(() => action()).child(icon);
  }
}
