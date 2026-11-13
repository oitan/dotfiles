// Start an agent in a new space: pick the machine (when there is more than one), Claude or Codex, then a project.
// Opened by an office's plant for that office's machine, or by the + button for the last machine picked. Type to filter, ↑/↓ to choose, Tab to switch agent, Enter to start, Esc to leave.
// Projects are git repos found on the machine plus folders you added (kept per machine, shown from then on).
// Type a path (/… or ~/…) to add a folder on any machine; locally the Add button opens the folder picker.
// A window like the theme picker: an outside click doesn't dismiss it, and controls stop the drag.

import { View, div, svg, image } from "gpui-kit";
import { v_flex, h_flex, InputState, Input, ScrollHandle, Scrollbar } from "gpui-base";
import { knownAgents, exec, run, theme, props, closeOverlay, pickFolder, shared, setShared, machines } from "herdr";

const stop = (_e, cx) => cx.stop_propagation();
const WANTED = ["claude", "codex"];
const TILES = ["#22a99a", "#e3814f", "#5b8def", "#8b7cf6", "#3fae6a", "#d9649a"];
// Git repos a few levels under the usual project folders, on whichever machine this is for.
const FIND = `echo "$HOME"; for r in "$HOME/dev" "$HOME/repos" "$HOME/code" "$HOME/projects" "$HOME/dotfiles"; do [ -d "$r" ] && find "$r" -maxdepth 3 -name .git -prune 2>/dev/null; done | sed 's|/\\.git$||' | sort -u`;
// A typed folder, made absolute on that machine if it exists.
const RESOLVE = `p="$1"; case "$p" in "~"*) p="$HOME\${p#\\~}";; esac; [ -d "$p" ] && cd "$p" && pwd`;
const KEPT = "launcher.projects"; // shared (persisted): { "<machine or empty>": [folder, ...] }

function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k) ?? "null") ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

export default class AgentLauncher extends View {
  init(_props, cx) {
    // A plant passes its office's machine; the + button passes none, so the last one picked is used.
    const given = props() ?? {};
    this.machine = "machine" in given ? given.machine ?? null : store.get("machine", null);
    this.loadId = 0;
    this.filter = "";
    this.at = 0;
    this.home = "";
    this.projects = null;
    this.agents = null;
    this.error = null;
    this.note = null;
    this.chosen = store.get("agent", "claude");
    this.recent = store.get(`recent:${this.machine ?? ""}`, []);
    this.handle = cx.focus_handle();
    this.scroll = ScrollHandle.new();
    this.input = InputState.new({ placeholder: "Search projects, or type a folder path…" });
    this.input.on("change", (_e, cx) => { this.filter = this.input.value(); this.at = 0; this.note = null; cx.notify(); });
    this.input.on("submit", (_e, cx) => this.choose(this.list()[this.at], cx));
    this.input.focus();
    cx.timer.after(600, () => this.input.focus());
    this.load(cx);
  }

  // The agents installed on this machine and the projects found on it; a stale answer (the machine changed meanwhile) is dropped.
  load(cx) {
    const id = ++this.loadId, machine = this.machine;
    this.agents = null; this.projects = null; this.error = null; this.home = "";
    cx.spawn(async (cx) => {
      let agents = [];
      try {
        const all = await knownAgents({ on: machine });
        agents = WANTED.map((k) => all.find((a) => a.key === k)).filter(Boolean);
      } catch {}
      if (id !== this.loadId) return;
      this.agents = agents;
      if (!agents.some((a) => a.key === this.chosen && a.installed)) this.chosen = agents.find((a) => a.installed)?.key ?? this.chosen;
      cx.notify();
    });
    cx.spawn(async (cx) => {
      let lines = [], error = null;
      try {
        const r = await exec("sh", ["-c", FIND], { on: machine, timeout: 20000 });
        lines = r.stdout.split("\n").filter(Boolean);
      } catch (e) { error = String(e); }
      if (id !== this.loadId) return;
      this.home = lines.shift() ?? "";
      this.projects = lines; this.error = error;
      cx.notify();
    });
  }

  chooseMachine(name, cx) {
    if (name === this.machine) return;
    this.machine = name;
    store.set("machine", name);
    this.recent = store.get(`recent:${name ?? ""}`, []);
    this.filter = ""; this.input.set_value(""); this.at = 0; this.note = null;
    this.load(cx);
    cx.notify();
  }

  dismiss() { closeOverlay(props().overlay); }

  agent() { return this.agents?.find((a) => a.key === this.chosen) ?? null; }

  kept() { return (shared(KEPT) ?? {})[this.machine ?? ""] ?? []; }

  // Rows: { path, kept } for projects, or { add } for a typed folder that can be added.
  list() {
    const f = this.filter.trim().toLowerCase(), kept = this.kept(), keptSet = new Set(kept);
    const rank = (p) => { const i = this.recent.indexOf(p); return i < 0 ? 99 : i; };
    const paths = [...new Set([...kept, ...(this.projects ?? [])])];
    const rows = paths.filter((p) => p.toLowerCase().includes(f)).sort((a, b) => rank(a) - rank(b) || a.localeCompare(b))
      .map((path) => ({ path, kept: keptSet.has(path) }));
    const typed = this.filter.trim();
    if ((typed.startsWith("/") || typed.startsWith("~")) && !paths.includes(typed)) rows.unshift({ add: typed });
    return rows;
  }

  switchAgent() {
    const ok = (this.agents ?? []).filter((a) => a.installed);
    if (ok.length < 2) return;
    this.chosen = ok[(ok.findIndex((a) => a.key === this.chosen) + 1) % ok.length].key;
    store.set("agent", this.chosen);
  }

  choose(row, cx) {
    if (!row) return;
    if (row.add) this.addTyped(row.add, cx);
    else this.launch(row.path);
  }

  launch(path) {
    const agent = this.agent();
    if (!path || !agent?.installed) return;
    this.recent = [path, ...this.recent.filter((p) => p !== path)].slice(0, 12);
    store.set(`recent:${this.machine ?? ""}`, this.recent);
    run("space.new", { folder: path, argv: agent.run, machine: this.machine ?? "" });
    this.dismiss();
  }

  keep(path) {
    const all = { ...(shared(KEPT) ?? {}) }, key = this.machine ?? "";
    all[key] = [path, ...(all[key] ?? []).filter((p) => p !== path)];
    setShared(KEPT, all);
  }

  forget(path) {
    const all = { ...(shared(KEPT) ?? {}) }, key = this.machine ?? "";
    all[key] = (all[key] ?? []).filter((p) => p !== path);
    setShared(KEPT, all);
  }

  // The typed folder must exist on this machine; it is stored as its absolute path.
  addTyped(typed, cx) {
    cx.spawn(async (cx) => {
      try {
        const r = await exec("sh", ["-c", RESOLVE, "sh", typed], { on: this.machine, timeout: 15000 });
        const path = r.stdout.trim();
        if (r.code !== 0 || !path) this.note = `Not a folder on ${this.machine ?? "this computer"}: ${typed}`;
        else this.added(path);
      } catch (e) { this.note = String(e); }
      cx.notify();
    });
  }

  // Add button: the system folder picker here; on another machine, start typing a path.
  addFolder(cx) {
    if (this.machine) {
      this.input.set_value("~/");
      this.input.focus();
      return;
    }
    cx.spawn(async (cx) => {
      const path = await pickFolder({ prompt: "Add project" });
      if (path) this.added(path);
      this.input.focus();
      cx.notify();
    });
  }

  added(path) {
    this.keep(path);
    this.input.set_value("");
    this.filter = "";
    this.note = null;
    this.at = Math.max(0, this.list().findIndex((r) => r.path === path));
    this.scroll.scroll_to_item(this.at);
  }

  glyph(a, t, size) {
    if (!a.icon) return null;
    return a.tint ? svg(a.icon).size(size).flex_none().text_color(t.foreground) : image(a.icon).w(size).h(size).flex_none();
  }

  row(r, i, t, short) {
    const on = i === this.at;
    const base = h_flex().id(`project-${r.path ?? "add"}`).h(38).flex_none().px(10).gap(10).items_center().rounded(8).cursor_pointer().on_mouse_down("left", stop)
      .bg(on ? t.selected : t.popover).hover((s) => s.bg(t.hover));
    if (r.add) {
      return base.on_click((_e, cx) => this.addTyped(r.add, cx))
        .child(h_flex().size(20).flex_none().rounded(5).border_1().border_color(t.accent).items_center().justify_center().text_size(13).text_color(t.accent).child("+"))
        .child(div().flex_1().min_w(0).truncate().text_color(t.foreground).child(`Add ${r.add}`))
        .child(div().flex_none().text_size(11).text_color(t.dim).child("Enter"));
    }
    const name = r.path.split("/").pop(), where = short(r.path.slice(0, r.path.length - name.length - 1));
    return base.on_click(() => this.launch(r.path))
      .child(h_flex().size(20).flex_none().rounded(5).bg(TILES[hash(r.path) % TILES.length]).items_center().justify_center().text_size(11).font_bold().text_color("#ffffff").child([...name][0]?.toUpperCase() ?? "?"))
      .child(div().flex_none().max_w(170).truncate().text_color(t.foreground).child(name))
      .child(div().flex_1().min_w(0).truncate().text_right().text_size(11).text_color(t.dim).child(where))
      .when(this.recent.includes(r.path), (el) => el.child(div().flex_none().text_size(10).text_color(t.dim).child("recent")))
      .when(r.kept, (el) => el.child(div().id(`forget-${r.path}`).flex_none().px(5).rounded(4).text_color(t.dim).hover((s) => s.bg(t.hover).text_color(t.foreground))
        .tooltip("Remove from this list").on_mouse_down("left", stop).on_click((_e, cx) => { cx.stop_propagation(); this.forget(r.path); cx.notify(); }).child("×")));
  }

  render(cx) {
    const t = theme(), list = this.list(), agent = this.agent(), known = machines();
    if (this.at >= list.length) this.at = Math.max(0, list.length - 1);
    const short = (p) => (this.home && p.startsWith(this.home) ? "~" + p.slice(this.home.length) : p);
    const sel = list[this.at];
    return v_flex().id("agent-launcher").track_focus(this.handle).size_full().min_h(0).p(16).gap(10).bg(t.popover).text_size(13)
      .on_key_down((e, cx) => {
        const k = e.key;
        if (k === "escape") return this.dismiss();
        if (k === "tab") this.switchAgent();
        else if (k === "down") { this.at = (this.at + 1) % Math.max(1, list.length); this.scroll.scroll_to_item(this.at); }
        else if (k === "up") { this.at = (this.at + list.length - 1) % Math.max(1, list.length); this.scroll.scroll_to_item(this.at); }
        else return;
        cx.stop_propagation(); cx.notify();
      })
      .child(h_flex().items_center().gap(8)
        .child(div().text_size(15).font_semibold().text_color(t.foreground).child("New agent"))
        .child(div().flex_1().min_w(0).truncate().text_size(11).text_color(t.dim).child(`in a new space · ${this.machine ?? "this computer"}`))
        .child(div().id("launcher-esc").px(6).py(2).rounded(5).text_size(11).text_color(t.dim).cursor_pointer().hover((s) => s.bg(t.hover).text_color(t.foreground))
          .on_mouse_down("left", stop).on_click(() => this.dismiss()).child("Esc")))
      .when(known.length > 1, (el) => el.child(h_flex().gap(6).flex_none().flex_wrap().children(known.map((m) => {
        const on = (m.name ?? null) === this.machine, ready = m.layout !== "unavailable";
        return h_flex().id(`machine-${m.name ?? "local"}`).h(28).px(10).gap(6).items_center().rounded(8).border_1().text_size(12)
          .border_color(on ? t.accent : t.border).bg(on ? t.selected : t.popover).text_color(ready ? (on ? t.foreground : t.muted) : t.dim)
          .when(ready, (el) => el.cursor_pointer().hover((s) => s.bg(t.hover)).on_mouse_down("left", stop).on_click((_e, cx) => this.chooseMachine(m.name ?? null, cx)))
          .tooltip(ready ? (m.name ? `Start the agent on ${m.name}` : "Start the agent on this computer") : `${m.name} is offline`)
          .child(svg(`mods/workspace-chrome/${m.name ? "server" : "monitor"}.svg`).size(12).flex_none())
          .child(div().child(m.name ?? "This computer"));
      }))))
      .child(h_flex().gap(8).flex_none().children((this.agents ?? []).map((a) => {
        const on = a.key === this.chosen;
        return h_flex().id(`agent-${a.key}`).flex_1().h(38).px(12).gap(8).items_center().rounded(9).border_1()
          .border_color(on ? t.accent : t.border).bg(on ? t.selected : t.popover)
          .when(a.installed, (el) => el.cursor_pointer().hover((s) => s.bg(t.hover)).on_mouse_down("left", stop)
            .on_click((_e, cx) => { this.chosen = a.key; store.set("agent", a.key); cx.notify(); }))
          .child(this.glyph(a, t, 16) ?? div())
          .child(div().flex_1().truncate().text_color(a.installed ? t.foreground : t.dim).child(a.name))
          .when(!a.installed, (el) => el.child(div().text_size(11).text_color(t.dim).child("not installed")))
          .when(on, (el) => el.child(div().text_color(t.accent).child("✓")));
      })))
      .when(this.agents && !this.agents.length, (el) => el.child(div().text_color(t.blocked).text_size(12).child("Couldn't check for Claude and Codex on this machine.")))
      .child(h_flex().gap(8).flex_none()
        .child(h_flex().flex_1().min_w(0).h(34).px(10).items_center().rounded(9).border_1().border_color(t.accent).bg(t.background).on_mouse_down("left", stop)
          .child(Input.new(this.input).flex_1().h_full().text_size(12.8).text_color(t.foreground)))
        .child(div().id("launcher-add").h(34).px(12).flex().items_center().flex_none().rounded(9).border_1().border_color(t.border).text_size(12).text_color(t.muted)
          .cursor_pointer().hover((s) => s.bg(t.hover).text_color(t.foreground)).on_mouse_down("left", stop)
          .tooltip(this.machine ? `Type the folder's path on ${this.machine}` : "Add a folder that isn't a git repo")
          .on_click((_e, cx) => this.addFolder(cx)).child("+ Add")))
      .child(div().flex_1().min_h(0).relative()
        .child(v_flex().id("launcher-list").absolute().inset_0().overflow_y_scroll().track_scroll(this.scroll).gap(2)
          .children(list.map((r, i) => this.row(r, i, t, short)))
          .when(!list.length, (el) => el.child(div().p(8).text_color(t.dim).child(this.error ?? (this.projects === null ? "Looking for projects…" : "No projects found. Use + Add, or type a folder path.")))))
        .child(Scrollbar.vertical("launcher-list").absolute().inset_0()))
      .when(Boolean(this.note), (el) => el.child(div().flex_none().text_size(11).text_color(t.blocked).child(this.note)))
      .child(div().flex_none().text_size(11).text_color(t.dim).child(sel?.add ? "Enter adds this folder to your projects"
        : agent ? `Enter starts ${agent.name} in a new space · Tab switches agent` : "Enter to start · Tab switches agent"));
  }
}
