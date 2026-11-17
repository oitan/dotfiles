// The T3-style agents list: a card per active agent (pinned first), then a collapsed "Snoozed" and "Settled" section.
// Pin is Herdr's terminal.pin and settle is its tab.settle (a settled tab keeps running and comes back when shown or
// when an agent in it needs you). Snooze is ours: a wake-up time per agent in shared state, kept even while it needs you (its row shows a red dot).

import { div, svg } from "gpui-kit";
import { v_flex, h_flex } from "gpui-base";
import { run, openOverlay } from "herdr";

export const SNOOZED = "agents.snoozed"; // shared (persisted): { "<agent address>": wake time in ms }
export const ARCHIVED = "agents.archived"; // shared (persisted): { "<agent address>": true }, only meaningful while its tab is settled
export const FILTER = "agents.filter"; // shared (persisted): { space, name } while the list shows one project, else null
export const AUTOSETTLE = "agents.autosettle"; // shared (persisted): days idle before a tab settles by itself (0 = off); 3 when never set
export const PRIORITY = "agents.priority"; // shared (persisted): { "<agent address>": "high" | "low" }, absent = normal
export const SORT = "agents.sort"; // shared (persisted): "priority" (the default) or "recent"
export const UNREAD = "agents.unread"; // shared (persisted): { "<agent address>": true }, cleared when you switch to that agent

const TILES = ["#22a99a", "#e3814f", "#5b8def", "#8b7cf6", "#3fae6a", "#d9649a"];
const MARK = { ansi6: "#22a99a", ansi3: "#e3814f", ansi4: "#5b8def", ansi5: "#8b7cf6", ansi2: "#3fae6a", ansi1: "#d9649a" };
const RANK = { blocked: 4, done: 3, working: 2, idle: 1 };
const WEIGHT = { high: 1, low: -1 };
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function age(ms) {
  const m = Math.floor(Math.max(0, ms) / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h}h` : `${Math.floor(h / 24)}d`;
}

// "6:49 PM", or "Mon 9:00 AM" when it isn't today.
export function clock(ts, now) {
  const d = new Date(ts), h = d.getHours(), m = String(d.getMinutes()).padStart(2, "0");
  const t = `${h % 12 || 12}:${m} ${h < 12 ? "AM" : "PM"}`;
  return new Date(now).toDateString() === d.toDateString() ? t : `${DAYS[d.getDay()]} ${t}`;
}

// Active cards in the order shown (pinned, then high priority before normal before low, then blocked, done, idle; a pinned one stays up top whatever it is doing), then the agents
// that are working, what is snoozed and what is settled.
export function groups(list, tabs, snoozed, now, archived = {}, priority = {}, sort = "priority") {
  const tab = (a) => tabs.get(a.tab);
  const settled = [], shelved = [], asleep = [], working = [], active = [];
  for (const a of list) {
    if (tab(a)?.settled) (archived[a.address] ? shelved : settled).push(a); // archived only counts while it stays settled
    else if ((snoozed[a.address] ?? 0) > now) asleep.push(a); // snoozed holds even when it needs you
    else if (a.status === "working" && !a.pinned && !a.focused) working.push(a); // the open agent stays in view, highlighted
    else active.push(a);
  }
  const changed = (a) => tab(a)?.changed_at ?? 0;
  // "recent" is plain recency (pinned still first); "priority" goes by priority, then what needs you, then recency.
  const recent = sort === "recent", weight = (a) => (recent ? 0 : WEIGHT[priority[a.address]] ?? 0);
  active.sort((x, y) => Number(y.pinned) - Number(x.pinned) || weight(y) - weight(x) || (recent ? 0 : (RANK[y.status] ?? 0) - (RANK[x.status] ?? 0)) || changed(y) - changed(x));
  working.sort((x, y) => weight(y) - weight(x) || (tab(y)?.working_since ?? 0) - (tab(x)?.working_since ?? 0));
  asleep.sort((x, y) => snoozed[x.address] - snoozed[y.address]);
  const bySettled = (x, y) => (tab(y)?.settled_at ?? 0) - (tab(x)?.settled_at ?? 0);
  settled.sort(bySettled);
  shelved.sort(bySettled);
  return { active, working, asleep, settled, shelved };
}

// What `c` holds: t (theme), now, tabs, colors (space colors), num (address -> hotkey number), jump (number -> keys),
// host (the view: hovered, open, notify), snoozed.
function title(a, c) {
  const tab = c.tabs.get(a.tab), clean = (s) => (s ?? "").replace(/^[^\p{L}\p{N}\[(]+/u, "").trim(); // drop a leading status glyph, keep "[Planning]"
  return (tab?.named ? tab.name : null) || clean(a.title) || a.program?.name || a.address;
}

function tile(a, c, size = 18, faded = false) {
  const color = c.colors[a.space];
  const fill = color ? (color.startsWith("#") ? color : (MARK[color] ?? c.t[color])) : TILES[hash(a.space ?? a.address) % TILES.length];
  return h_flex().size(size).flex_none().rounded(5).bg(fill).items_center().justify_center().text_size(size * 0.58).font_bold().text_color("#ffffff")
    .when(faded, (el) => el.opacity(0.5)).child([...(a.space_name || "?")][0].toUpperCase());
}

// The agent's own state, on the right of a card: working spins, blocked asks for you, done is a dot.
function activity(a, t) {
  if (a.status === "working") return svg("mods/workspace-chrome/spinner.svg").size(12).flex_none().text_color(t.working).spin(900);
  if (a.status === "blocked") return div().flex_none().px(6).h(18).rounded(5).bg(t.blocked + "26").text_size(10.5).font_semibold().text_color(t.blocked).flex().items_center().child("Needs you");
  if (a.status === "done") return div().size(7).mx(3).flex_none().rounded(4).bg(t.done);
  return div().size(7).mx(3).flex_none().rounded(4).border(1.5).border_color(t.idle ?? t.dim);
}

// Unread/read only means something once the agent has stopped for you: not while it is working or blocked.
const reads = (a) => a.status !== "working" && a.status !== "blocked";

function openMenu(a, mode, c) {
  const settled = Boolean(c.tabs.get(a.tab)?.settled);
  openOverlay({
    mod: "agent-menu", kind: "popup", width: 250, height: { snooze: 262, rename: 126, autosettle: 214, priority: 150 }[mode] ?? ((settled ? 334 : 298) - (reads(a) ? 0 : 30)),
    props: {
      address: a.address, tab: a.tab, pane: a.pane, space: a.space, project: a.space_name, name: title(a, c), pinned: a.pinned, settled,
      archived: Boolean(c.archived[a.address]), filtered: c.filter?.space === a.space, snoozed: (c.snoozed[a.address] ?? 0) > c.now,
      priority: c.priority[a.address] ?? "normal", unread: Boolean(c.unread[a.address]), readable: reads(a), mode,
    },
  });
}

const button = (id, children, on) => div().id(id).flex_none().h(22).px(6).gap(4).flex().items_center().rounded(6).text_size(11).cursor_pointer()
  .on_click((_e, cx) => { cx.stop_propagation(); on(cx); }).children([].concat(children));

// The same circle as the menu: a ring to mark unread, a filled dot (the card's unread dot) to mark read.
function unreadMark(a, c) {
  const { t } = c;
  return div().size(13).flex().items_center().justify_center()
    .child(c.unread[a.address] ? div().size(9).rounded(5).bg(t.accent) : div().size(9).rounded(5).border(1.5).border_color(t.muted));
}

function card(a, c) {
  const { t, host } = c, tab = c.tabs.get(a.tab);
  const n = c.num.get(a.address), combo = c.jump.get(n), hot = host.hovered === a.address;
  return v_flex().id(`card-${a.address}`).flex_none().px(10).py(8).gap(3).rounded(10).cursor_pointer()
    .bg(a.focused ? t.selected : t.raised).hover((s) => s.bg(a.focused ? t.selected : t.hover))
    .tooltip(`${a.space_name} · ${a.program?.name ?? "agent"} · ${a.status}${combo ? ` · ${combo}` : ""}`)
    .on_hover((on, cx) => {
      if (on) host.hovered = a.address;
      else if (host.hovered === a.address) host.hovered = null;
      cx.notify();
    })
    .on_click(() => run("pane.focus", { pane: a.pane }))
    .on_mouse_down("right", () => openMenu(a, "main", c))
    .child(h_flex().gap(8).items_center().h(22)
      .when(Boolean(combo), (el) => el.child(div().flex_none().w(8).text_size(10.5).text_color(t.dim).child(String(n))))
      .child(tile(a, c))
      .child(div().flex_1().min_w(0).truncate().text_size(11.5).text_color(t.muted).child(a.space_name))
      .when(c.priority[a.address] === "high", (el) => el.child(div().flex_none().text_size(10.5).font_semibold().text_color(t.blocked).child("High")))
      .when(c.priority[a.address] === "low", (el) => el.child(div().flex_none().text_size(10.5).text_color(t.dim).child("Low")))
      .when(a.pinned, (el) => el.child(svg("mods/workspace-chrome/pin.svg").size(11).flex_none().text_color(t.dim)))
      .when(hot, (el) => el
        .child(button(`snooze-${a.address}`, svg("mods/workspace-chrome/clock.svg").size(13).text_color(t.muted), () => openMenu(a, "snooze", c)).hover((s) => s.bg(t.hover)).tooltip("Snooze"))
        .child(button(`settle-${a.address}`, [svg("mods/workspace-chrome/check.svg").size(12).text_color(t.muted), div().text_color(t.muted).child("Settle")], () => run("tab.settle", { id: a.tab })).hover((s) => s.bg(t.hover)).tooltip("Put this tab away; it keeps running")))
      .when(!hot, (el) => el
        .child(div().flex_none().text_size(11).text_color(t.dim).child(tab?.changed_at ? age(c.now - tab.changed_at) : ""))
        .child(activity(a, t))))
    .child(h_flex().gap(6).items_center().min_w(0)
      .when(reads(a), (el) => el.child(div().size(13).flex_none().flex().items_center().justify_center()
        .when(hot, (el) => el.child(unreadMark(a, c).id(`unread-${a.address}`).cursor_pointer()
          .on_click((_e, cx) => { cx.stop_propagation(); host.setUnread(a.address, !c.unread[a.address]); })
          .tooltip(c.unread[a.address] ? "Mark read" : "Mark unread")))
        .when(!hot && c.unread[a.address], (el) => el.child(div().size(7).rounded(4).bg(t.accent)))))
      .child(div().flex_1().min_w(0).truncate().text_size(13).text_color(t.foreground).when(c.unread[a.address] && reads(a), (el) => el.font_semibold()).child(title(a, c))));
}

// A compact row for a settled, snoozed or archived agent: dimmed tile, title, then its age (or wake time), and on hover its actions.
function row(a, c, { id, meta, actions }) {
  const { t, host } = c, hot = host.hovered === id, n = c.num.get(a.address), combo = c.jump.get(n), live = a.status === "working"; // live rows are not dimmed
  return h_flex().id(id).h(30).flex_none().px(10).gap(8).items_center().rounded(8).cursor_pointer().hover((s) => s.bg(t.hover))
    .on_hover((on, cx) => {
      if (on) host.hovered = id;
      else if (host.hovered === id) host.hovered = null;
      cx.notify();
    })
    .on_click(() => run("pane.focus", { pane: a.pane })) // showing a settled tab brings it back
    .on_mouse_down("right", () => openMenu(a, "main", c))
    .when(Boolean(combo), (el) => el.child(div().flex_none().w(8).text_size(10.5).text_color(t.dim).child(String(n))))
    .child(tile(a, c, 18, !hot && !live))
    .when(c.unread[a.address] && reads(a), (el) => el.child(div().size(6).flex_none().rounded(3).bg(t.accent)))
    .child(div().flex_1().min_w(0).truncate().text_size(12.5).text_color(hot || live ? t.foreground : t.muted).child(title(a, c)))
    .child(hot
      ? h_flex().gap(2).flex_none().children(actions.map((x, i) => button(`${id}-${i}`, x.label, x.on).hover((s) => s.bg(t.raised)).text_color(t.muted).tooltip(x.tip)))
      : h_flex().gap(6).flex_none().items_center()
          .when(a.status === "working", (el) => el.child(svg("mods/workspace-chrome/spinner.svg").size(12).flex_none().text_color(t.working).spin(900)))
          .when(a.status === "blocked", (el) => el.child(div().size(6).flex_none().rounded(3).bg(t.blocked).tooltip("Needs you")))
          .child(div().text_size(11).text_color(t.dim).child(meta)));
}

function section(label, count, open, c, key) {
  const { t, host } = c;
  return h_flex().id(`section-${key}`).h(28).flex_none().px(10).mt(6).gap(6).items_center().text_size(11.5).text_color(t.dim).cursor_pointer()
    .hover((s) => s.text_color(t.foreground))
    .on_click((_e, cx) => host.toggleSection(key, cx))
    .child(div().child(label)).child(div().flex_1()).child(div().child(String(count)))
    .child(svg(`mods/workspace-chrome/chevron-${open ? "down" : "right"}.svg`).size(11).flex_none());
}

// The row for the project filter, with a way to clear it.
function filterChip(c) {
  const { t, host } = c;
  return h_flex().id("filter-chip").h(28).flex_none().pl(10).pr(4).gap(6).items_center().rounded(8).bg(t.raised).text_size(11.5).text_color(t.muted)
    .child(div().flex_none().child("Project"))
    .child(div().flex_1().min_w(0).truncate().font_semibold().text_color(t.foreground).child(c.filter.name))
    .child(button("filter-clear", "×", () => host.setFilter(null)).hover((s) => s.bg(t.hover)).tooltip("Show all projects"));
}

// The list's rows; `host` keeps hovered/open state and re-renders.
export function listRows(g, c) {
  const { host, t } = c;
  const rows = [];
  if (c.filter) rows.push(filterChip(c));
  rows.push(...g.active.map((a) => card(a, c)));
  if (!g.active.length && !g.working.length) rows.push(div().px(10).py(8).text_size(12).text_color(t.dim).child(c.filter ? "No active agents in this project." : "No active agents."));
  if (g.working.length) {
    const open = host.open.working;
    rows.push(section("Working", g.working.length, open, c, "working"));
    if (open) rows.push(...g.working.map((a) => {
      const tab = c.tabs.get(a.tab), since = tab?.working_since ?? tab?.changed_at;
      return row(a, c, {
        id: `working-${a.address}`, meta: since ? age(c.now - since) : "",
        actions: [
          { label: svg("mods/workspace-chrome/clock.svg").size(13).text_color(t.muted), tip: "Snooze", on: () => openMenu(a, "snooze", c) },
          { label: svg("mods/workspace-chrome/check.svg").size(13).text_color(t.muted), tip: "Settle", on: () => run("tab.settle", { id: a.tab }) },
        ],
      });
    }));
  }
  const wake = (a) => (cx) => { const s = { ...c.snoozed }; delete s[a.address]; host.setSnoozed(s); cx.notify(); };
  const unarchive = (a) => () => { const all = { ...c.archived }; delete all[a.address]; host.setArchived(all); }; // only for agents archived before archiving closed the tab
  const archive = (a) => () => run("pane.close", { pane: a.pane }); // archiving ends the agent and closes its pane
  if (g.asleep.length) {
    const open = host.open.snoozed;
    rows.push(section("Snoozed", g.asleep.length, open, c, "snoozed"));
    if (open) rows.push(...g.asleep.map((a) => row(a, c, { id: `snoozed-${a.address}`, meta: clock(c.snoozed[a.address], c.now), actions: [{ label: "↩", tip: "Wake now", on: wake(a) }] })));
  }
  if (g.settled.length) {
    const open = host.open.settled;
    rows.push(section("Settled", g.settled.length, open, c, "settled"));
    if (open) rows.push(...g.settled.map((a) => {
      const tab = c.tabs.get(a.tab);
      return row(a, c, {
        id: `settled-${a.address}`, meta: tab?.settled_at ? age(c.now - tab.settled_at) : "",
        actions: [
          { label: "↩", tip: "Unsettle", on: () => run("tab.unsettle", { id: a.tab }) },
          { label: svg("mods/workspace-chrome/archive.svg").size(13).text_color(t.muted), tip: "Archive", on: archive(a) },
        ],
      });
    }));
  }
  if (g.shelved.length) {
    const open = host.open.archived;
    rows.push(section("Archived", g.shelved.length, open, c, "archived"));
    if (open) rows.push(...g.shelved.map((a) => {
      const tab = c.tabs.get(a.tab);
      return row(a, c, { id: `archived-${a.address}`, meta: tab?.settled_at ? age(c.now - tab.settled_at) : "", actions: [{ label: "↩", tip: "Unarchive", on: unarchive(a) }] });
    }));
  }
  return rows;
}
