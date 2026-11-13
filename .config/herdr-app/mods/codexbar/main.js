// CodexBar's view of Codex, as a panel: the usage limits with block bars, credits, limit-reset credits, plan and account.
// Codex only: it asks `codexbar usage --provider codex`, never Claude. Fetches only while this panel is showing.

import { View, div, svg } from "gpui-kit";
import { v_flex, h_flex } from "gpui-base";
import { exec, theme, layout, settings } from "herdr";

const STALE = 300000;    // data older than this is refetched when the panel is showing (it polls a web dashboard, so gently)
const CELLS = 24;

function find(node, id) {
  if (node?.id === id) return node;
  for (const child of node?.children ?? []) {
    const found = find(child, id);
    if (found) return found;
  }
  return null;
}
// The copy stays alive while hidden, so it asks whether its panel is on screen.
function shown() {
  const root = layout(), panel = find(root, "panel"), body = find(root, "panel-body");
  return Boolean(panel && !panel.hidden && body?.active === "codexbar");
}

// "6d 19h", "3h 5m", "12m": how long until `iso`, or null when it has passed.
function until(iso, now) {
  const ms = Date.parse(iso) - now;
  if (!(ms > 0)) return null;
  const m = Math.floor(ms / 60000), h = Math.floor(m / 60), d = Math.floor(h / 24);
  if (d >= 1) return `${d}d ${h % 24}h`;
  return h >= 1 ? `${h}h ${m % 60}m` : `${Math.max(1, m)}m`;
}

function ago(ms) {
  const m = Math.floor(Math.max(0, ms) / 60000);
  return m < 1 ? "just now" : m < 60 ? `${m}m ago` : `${Math.floor(m / 60)}h ago`;
}

export default class CodexBar extends View {
  init(_props, cx) {
    this.data = null; this.plan = null; this.at = 0; this.error = null; this.loading = false;
    cx.timer.every(30000, (cx) => this.maybe(cx));
    this.maybe(cx);
  }

  // Refresh when the panel is showing and what we have is old.
  maybe(cx, force) {
    if (this.loading || !shown()) return;
    if (!force && this.data && Date.now() - this.at < STALE) return;
    this.refresh(cx);
  }

  refresh(cx) {
    this.loading = true;
    cx.spawn(async (cx) => {
      try {
        const [json, text] = await Promise.all([
          exec("codexbar", ["usage", "--provider", "codex", "--json"], { timeout: 60000 }),
          exec("codexbar", ["usage", "--provider", "codex", "--no-color"], { timeout: 60000 }).catch(() => null),
        ]);
        if (json.code !== 0) throw new Error((json.stderr || json.stdout || "codexbar failed").trim().split("\n").pop());
        const item = JSON.parse(json.stdout)[0];
        if (!item) throw new Error("codexbar returned nothing for Codex");
        this.data = item;
        this.plan = /^Plan:\s*(.+)$/m.exec(text?.stdout ?? "")?.[1]?.trim() ?? item.usage?.loginMethod ?? null;
        this.at = Date.now(); this.error = null;
      } catch (e) { this.error = String(e?.message ?? e); }
      finally { this.loading = false; cx.notify(); }
    });
    cx.notify();
  }

  // One limit: its label, how much is left as a bar of blocks, and when it resets.
  limit(label, w, t, mono, now) {
    const left = Math.max(0, Math.min(100, 100 - (w.usedPercent ?? 0)));
    const color = left > 50 ? t.ansi2 : left > 20 ? t.ansi3 : t.ansi1;
    const filled = Math.round((left / 100) * CELLS), reset = w.resetsAt ? until(w.resetsAt, now) : null;
    return v_flex().gap(5)
      .child(h_flex().items_baseline().gap(8)
        .child(div().text_color(t.foreground).font_semibold().child(label))
        .child(div().flex_1())
        .child(div().text_color(color).font_semibold().child(`${Math.round(left)}% left`)))
      .child(h_flex().gap(2).children(Array.from({ length: CELLS }, (_, i) => div().flex_1().h(9).rounded(2).bg(i < filled ? color : t.raised))))
      .child(div().text_size(11).text_color(t.dim).child(reset ? `Resets in ${reset}${w.resetDescription ? ` · ${w.resetDescription}` : ""}` : (w.resetDescription ? `Resets ${w.resetDescription}` : "")));
  }

  row(t, label, value, tone) {
    return h_flex().gap(8).items_baseline().child(div().text_color(t.muted).child(label)).child(div().flex_1()).child(div().text_color(tone ?? t.foreground).child(value));
  }

  render(cx) {
    this.maybe(cx);
    const t = theme(), mono = settings().font_family ?? "JetBrains Mono", now = Date.now(), d = this.data, u = d?.usage;
    const windows = [["primary", "Session"], ["secondary", "Weekly"], ["tertiary", "Extra"]]
      .map(([k, fallback]) => [d?.rateWindowLabels?.[k] ?? fallback, u?.[k]]).filter(([, w]) => w);
    const reset = d?.resetCredits ?? u?.codexResetCredits;
    const nextExpiry = d?.resetCredits?.nextExpiresAt ? until(d.resetCredits.nextExpiresAt, now) : null;
    return v_flex().id("codexbar").size_full().min_h(0).rounded(10).overflow_hidden().bg(t.background).border_1().border_color(t.border).text_color(t.foreground).text_size(12.5).font_family(mono)
      .child(h_flex().h(42).flex_none().px(14).gap(8).items_center().border_b(1).border_color(t.border)
        .child(svg("mods/codexbar/gauge.svg").size(15).flex_none().text_color(t.muted))
        .child(div().font_semibold().child("Codex"))
        .child(div().flex_1().min_w(0).truncate().text_size(11).text_color(t.dim).child(this.plan ? `CodexBar · ${this.plan}` : "CodexBar"))
        .child(div().id("codexbar-refresh").flex_none().px(6).py(2).rounded(5).text_size(12).text_color(t.muted).cursor_pointer().hover((s) => s.bg(t.hover))
          .on_click((_e, cx) => this.maybe(cx, true)).child(this.loading ? "…" : "↻")))
      .child(v_flex().id("codexbar-body").flex_1().min_h(0).overflow_y_scroll().p(14).gap(16)
        .when(Boolean(this.error), (el) => el.child(v_flex().gap(4)
          .child(div().text_color(t.ansi1).child("Couldn't read Codex usage"))
          .child(div().text_size(11).text_color(t.dim).child(this.error))
          .child(div().text_size(11).text_color(t.dim).child("Needs the codexbar CLI (brew install codexbar) and a Codex login."))))
        .when(!d && !this.error, (el) => el.child(div().text_color(t.dim).child("Reading Codex usage…")))
        .when(Boolean(d), (el) => el
          .children(windows.map(([label, w]) => this.limit(label, w, t, mono, now)))
          .when(!windows.length, (el) => el.child(div().text_color(t.dim).child("No usage limits reported.")))
          .child(div().h(1).bg(t.border))
          .child(v_flex().gap(6)
            .child(this.row(t, "Credits", d.credits?.creditsAvailable ? `${d.credits.remaining} left` : `${d.credits?.remaining ?? 0} left`, d.credits?.creditsAvailable ? t.ansi2 : t.dim))
            .when(Boolean(reset?.available ?? reset?.availableCount), (el) => el.child(this.row(t, "Limit resets", `${reset.available ?? reset.availableCount} available`, t.ansi2)))
            .when(Boolean(nextExpiry), (el) => el.child(div().text_size(11).text_color(t.dim).text_right().child(`next one expires in ${nextExpiry}`))))
          .child(div().h(1).bg(t.border))
          .child(v_flex().gap(6)
            .when(Boolean(u?.accountEmail), (el) => el.child(this.row(t, "Account", u.accountEmail)))
            .when(Boolean(this.plan), (el) => el.child(this.row(t, "Plan", this.plan)))
            .child(div().text_size(11).text_color(t.dim).text_right().child(`${d.source ?? "codexbar"} · updated ${ago(now - this.at)}`)))));
  }
}
