// The menu for an agent in the list, after T3 Code's: Pin, Settle, Snooze ▸ | Rename, Regenerate title, Mark unread,
// Filter by project, Auto-settle behavior ▸ | Archive (a settled agent). Opened by right-click, or by the clock button
// for the snooze presets. Everything it remembers lives in shared state (agents.*).

import { View, div, svg } from "gpui-kit";
import { v_flex, h_flex, InputState, Input } from "gpui-base";
import { run, theme, props as hostProps, closeOverlay, openOverlay, shared, setShared } from "herdr";

const props = () => hostProps() ?? {};

const SNOOZED = "agents.snoozed";
const UNREAD = "agents.unread";
const ARCHIVED = "agents.archived";
const FILTER = "agents.filter";
const AUTOSETTLE = "agents.autosettle";
const HOUR = 3600e3;
const AUTO_DAYS = [[0, "Off"], [1, "After 1 day idle"], [3, "After 3 days idle"], [7, "After 7 days idle"], [14, "After 14 days idle"]];

function clock(ts) {
  const d = new Date(ts), h = d.getHours();
  return `${h % 12 || 12}:${String(d.getMinutes()).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

function presets(now) {
  const d = new Date(now), at = (date, hour) => { const x = new Date(date); x.setHours(hour, 0, 0, 0); return x.getTime(); };
  const tomorrow = new Date(d); tomorrow.setDate(d.getDate() + 1);
  const monday = new Date(d); monday.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7));
  const list = [];
  if (at(d, 18) > now) list.push([`This evening (${clock(at(d, 18))})`, at(d, 18)]);
  list.push([`In 1 hour (${clock(now + HOUR)})`, now + HOUR], [`In 3 hours (${clock(now + 3 * HOUR)})`, now + 3 * HOUR],
    [`Tomorrow (${clock(at(tomorrow, 9))})`, at(tomorrow, 9)], [`Next week (Mon ${clock(at(monday, 9))})`, at(monday, 9)]);
  return list;
}

// "45m", "2h", "3d" -> a wake-up time, or null.
function parse(text, now) {
  const m = /^\s*(\d+(?:\.\d+)?)\s*(m|min|h|hr|d)\s*$/i.exec(text);
  if (!m) return null;
  const unit = { m: 60e3, min: 60e3, h: HOUR, hr: HOUR, d: 24 * HOUR }[m[2].toLowerCase()];
  return now + Number(m[1]) * unit;
}

export default class AgentMenu extends View {
  init(_props, cx) {
    this.custom = false;
    this.input = InputState.new({ placeholder: "e.g. 45m, 2h, 3d" });
    this.input.on("submit", (_e, cx) => {
      const until = parse(this.input.value(), Date.now());
      if (until) this.snooze(until); else { this.bad = true; cx.notify(); }
    });
    this.input.on("change", (_e, cx) => { if (this.bad) { this.bad = false; cx.notify(); } });
    // Rename: the field starts with the title shown now; Enter saves, an empty name goes back to Herdr's own.
    this.rename = InputState.new({ placeholder: "Thread name" });
    if (props().mode === "rename") {
      this.rename.set_value(props().name ?? "");
      this.rename.focus();
      cx.timer.after(400, () => this.rename.focus());
    }
    this.rename.on("submit", () => {
      run("tab.rename", { id: props().tab, name: this.rename.value().trim() });
      this.close();
    });
  }

  close() { closeOverlay(props().overlay); }

  // Sets or clears this agent's entry in a shared { address: value } map, then closes.
  mark(key, value) {
    const all = { ...(shared(key) ?? {}) };
    if (value === null) delete all[props().address]; else all[props().address] = value;
    setShared(key, all);
    this.close();
  }

  snooze(until) { this.mark(SNOOZED, until); }

  item(t, id, icon, label, onClick, extra) {
    const glyph = typeof icon === "string" ? svg(`mods/workspace-chrome/${icon}.svg`).size(14).flex_none().text_color(t.muted)
      : icon ?? div().w(14).flex_none();
    return h_flex().id(id).h(30).px(8).gap(9).rounded(7).items_center().text_color(t.foreground).cursor_pointer().hover((s) => s.bg(t.hover))
      .on_click(onClick)
      .child(glyph)
      .child(div().flex_1().truncate().child(label))
      .when(Boolean(extra), (el) => el.child(extra));
  }

  // A 14px box centring a small mark: the same circle the card shows as its unread dot.
  circle(t, filled) {
    return div().w(14).flex_none().flex().items_center().justify_center()
      .child(filled ? div().size(9).rounded(5).bg(t.accent) : div().size(9).rounded(5).border(1.5).border_color(t.muted));
  }

  // Opens another menu mode in a new popup (a popup's size is fixed when it opens).
  go(p, mode, height) {
    this.close();
    openOverlay({ mod: "agent-menu", kind: "popup", width: 250, height, props: { ...p, mode, overlay: undefined } });
  }

  render(cx) {
    const t = theme(), p = props(), box = () => v_flex().w_full().p(5).bg(t.popover).text_size(12.8);
    const divider = () => div().mx(7).my(3).h(1).bg(t.border);
    if (p.mode === "snooze") {
      const now = Date.now();
      return box()
        .child(div().px(8).pt(4).pb(6).text_size(11).text_color(t.dim).truncate().child(`Snooze · ${p.name}`))
        .children(presets(now).map(([label, until]) => this.item(t, `snooze-${until}`, null, label, () => this.snooze(until))))
        .child(divider())
        .child(this.custom
          ? h_flex().h(32).mx(3).px(8).items_center().rounded(7).border_1().border_color(this.bad ? t.blocked : t.accent).bg(t.background)
              .child(Input.new(this.input).flex_1().h_full().text_size(12).text_color(t.foreground))
          : this.item(t, "snooze-custom", null, "Custom…", (_e, cx) => { this.custom = true; this.input.focus(); cx.notify(); }));
    }
    if (p.mode === "rename") {
      return box()
        .child(div().px(8).pt(4).pb(6).text_size(11).text_color(t.dim).child("Rename thread"))
        .child(h_flex().h(32).mx(3).px(8).items_center().rounded(7).border_1().border_color(t.accent).bg(t.background)
          .child(Input.new(this.rename).flex_1().h_full().text_size(12).text_color(t.foreground)))
        .child(div().px(8).pt(6).text_size(10.5).text_color(t.dim).child("Enter to save · empty resets it"));
    }
    if (p.mode === "autosettle") {
      const now = shared(AUTOSETTLE) ?? 3;
      return box()
        .child(div().px(8).pt(4).pb(6).text_size(11).text_color(t.dim).child("Auto-settle idle agents"))
        .children(AUTO_DAYS.map(([days, label]) => this.item(t, `auto-${days}`, null, label, () => { setShared(AUTOSETTLE, days); this.close(); },
          days === now ? div().text_color(t.accent).child("✓") : null)));
    }
    return box()
      .child(this.item(t, "pin", p.pinned ? "pin-off" : "pin", p.pinned ? "Unpin thread" : "Pin thread", () => {
        run("terminal.pin", { terminal: p.address, pinned: !p.pinned });
        this.close();
      }))
      .child(this.item(t, "settle", "check", p.settled ? "Unsettle thread" : "Settle thread", () => {
        run(p.settled ? "tab.unsettle" : "tab.settle", { id: p.tab });
        this.close();
      }))
      .child(p.snoozed
        ? this.item(t, "wake", "clock", "Wake now", () => this.mark(SNOOZED, null))
        : this.item(t, "snooze", "clock", "Snooze", () => this.go(p, "snooze", 262), svg("mods/workspace-chrome/chevron-right.svg").size(11).flex_none().text_color(t.dim)))
      .child(divider())
      .child(this.item(t, "rename", "square-pen", "Rename thread", () => this.go(p, "rename", 126)))
      .child(this.item(t, "regen", div().w(14).flex_none().text_center().text_color(t.muted).child("↻"), "Regenerate title", () => {
        run(`agents-office.regen-${p.address}`);
        this.close();
      }))
      // The circle shows the state you would be switching to: a ring for "Mark unread", a filled dot for "Mark read".
      .when(p.readable !== false, (el) => el.child(this.item(t, "unread", this.circle(t, p.unread), p.unread ? "Mark read" : "Mark unread", () => this.mark(UNREAD, p.unread ? null : true))))
      .child(this.item(t, "filter", "search", p.filtered ? "Show all projects" : `Filter by ${p.project}`, () => {
        setShared(FILTER, p.filtered ? null : { space: p.space, name: p.project });
        this.close();
      }))
      .child(this.item(t, "autosettle", "settings", "Auto-settle behavior", () => this.go(p, "autosettle", 214), svg("mods/workspace-chrome/chevron-right.svg").size(11).flex_none().text_color(t.dim)))
      .when(p.settled, (el) => el.child(divider())
        .child(this.item(t, "archive", "archive", p.archived ? "Unarchive thread" : "Archive thread", () => this.mark(ARCHIVED, p.archived ? null : true))));
  }
}
