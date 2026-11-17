// Plain terminals that finished a long command, newest first: ✓/✗ by exit code, the command, how long it ran and
// when it ended; unread until you look at that terminal. Fed by the zsh hook (shell/cmd-done.zsh), which sets the
// labels cmd.text, cmd.exit, cmd.secs and cmd.at on the terminal. What you have seen is shared state "terms.seen".

import { View, div, svg } from "gpui-kit";
import { v_flex, h_flex } from "gpui-base";
import { run, exec, terminals, focused, theme, settings, shared, setShared } from "herdr";

const SEEN = "terms.seen"; // shared (persisted): { "<terminal address>": cmd.at it was seen at }
const MAX = 60;

function finished() {
  return terminals()
    .filter((t) => Number(t.labels?.["cmd.at"]) > 0)
    .map((t) => ({ t, at: Number(t.labels["cmd.at"]), code: Number(t.labels["cmd.exit"]), secs: Number(t.labels["cmd.secs"]) || 0, text: t.labels["cmd.text"] ?? "" }))
    .sort((a, b) => b.at - a.at)
    .slice(0, MAX);
}

function dur(secs) {
  if (secs < 60) return `${secs}s`;
  const m = Math.floor(secs / 60);
  return m < 60 ? `${m}m ${secs % 60}s` : `${Math.floor(m / 60)}h ${m % 60}m`;
}
function ago(ms) {
  const m = Math.floor(Math.max(0, ms) / 60000);
  return m < 1 ? "just now" : m < 60 ? `${m}m ago` : m < 1440 ? `${Math.floor(m / 60)}h ago` : `${Math.floor(m / 1440)}d ago`;
}

export default class TerminalDone extends View {
  init(_props, cx) {
    // Looking at a terminal reads its result.
    cx.timer.every(1500, () => this.seeFocused());
  }

  seeFocused() {
    const f = focused()?.terminal, seen = shared(SEEN) ?? {};
    const hit = f && finished().find((x) => x.t.address === f);
    if (hit && (seen[f] ?? 0) < hit.at) setShared(SEEN, { ...seen, [f]: hit.at });
  }

  dismiss(x) { exec("hc", ["label", x.t.address, "cmd.text=", "cmd.exit=", "cmd.secs=", "cmd.at="]).catch(() => {}); }

  row(x, t, now, unread) {
    const bad = x.code !== 0, color = bad ? t.ansi1 : t.ansi2, id = x.t.address;
    return h_flex().id(`term-${id}`).gap(9).px(10).py(8).rounded(8).items_start().cursor_pointer().hover((s) => s.bg(t.hover))
      .on_click(() => { setShared(SEEN, { ...(shared(SEEN) ?? {}), [id]: x.at }); run("pane.focus", { terminal: id }); })
      .child(div().flex_none().w(14).text_color(color).font_semibold().child(bad ? "✗" : "✓"))
      .child(v_flex().flex_1().min_w(0).gap(2)
        .child(div().min_w(0).truncate().text_color(unread ? t.foreground : t.muted).when(unread, (el) => el.font_semibold()).child(x.text))
        .child(div().min_w(0).truncate().text_size(11).text_color(t.dim)
          .child(`${x.t.labels?.where ?? id} · ${bad ? `exit ${x.code} · ` : ""}${dur(x.secs)} · ${ago(now - x.at)}`)))
      .when(unread, (el) => el.child(div().size(7).mt(5).flex_none().rounded(4).bg(t.accent)))
      .child(div().id(`dismiss-${id}`).flex_none().px(5).rounded(4).text_color(t.dim).cursor_pointer().hover((s) => s.bg(t.raised).text_color(t.foreground))
        .tooltip("Dismiss").on_click((_e, cx) => { cx.stop_propagation(); this.dismiss(x); }).child("×"));
  }

  render() {
    const t = theme(), mono = settings().font_family ?? "JetBrains Mono", now = Date.now(), seen = shared(SEEN) ?? {}, list = finished();
    const isUnread = (x) => (seen[x.t.address] ?? 0) < x.at;
    const unread = list.filter(isUnread).length;
    return v_flex().id("terminal-done").size_full().min_h(0).rounded(10).overflow_hidden().bg(t.background).border_1().border_color(t.border).text_color(t.foreground).text_size(12.5).font_family(mono)
      .child(h_flex().h(42).flex_none().px(14).gap(8).items_center().border_b(1).border_color(t.border)
        .child(svg("mods/terminal-done/terminal.svg").size(15).flex_none().text_color(t.muted))
        .child(div().font_semibold().child("Terminals"))
        .child(div().flex_1().min_w(0).truncate().text_size(11).text_color(t.dim).child(list.length ? `${list.length} finished${unread ? ` · ${unread} unread` : ""}` : ""))
        .when(list.length > 0, (el) => el.child(div().id("terms-clear").flex_none().px(6).py(2).rounded(5).text_size(11).text_color(t.muted).cursor_pointer().hover((s) => s.bg(t.hover))
          .tooltip("Dismiss all").on_click(() => list.forEach((x) => this.dismiss(x))).child("Clear"))))
      .child(v_flex().id("terms-body").flex_1().min_h(0).overflow_y_scroll().p(10).gap(2)
        .when(!list.length, (el) => el.child(v_flex().gap(4).p(4)
          .child(div().text_color(t.dim).child("No finished commands."))
          .child(div().text_size(11).text_color(t.dim).child("Commands that run 10s or longer in a terminal show up here when they end."))))
        .children(list.map((x) => this.row(x, t, now, isUnread(x)))));
  }
}
