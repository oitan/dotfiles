import { View, div, svg } from "gpui-kit";
import { v_flex, h_flex, Scrollbar } from "gpui-base";
import { spaces, panes, focused, exec, theme, window, layout } from "herdr";

function location() {
  const space = spaces().find((s) => s.active), f = focused();
  const pane = f?.pane ? panes().find(p => p.pane === f.pane) : null;
  const on = f?.pane === null ? (f.terminal?.includes("/") ? f.terminal.split("/")[0] : null) : space?.machine ?? null;
  return { cwd: pane?.cwd || f?.cwd || space?.folder, on };
}
const key = (filter) => JSON.stringify([location(), filter]);

const STALE = 60000;
const FILTERS = [["all", "Open"], ["mine", "Mine"], ["review", "Review"]];
const MAX_REPOS = 12;     // repos fetched at once (the one here plus those one level down)
const BATCH = 4;          // gh calls in flight together
// The repo that contains the folder, then the git repos directly inside it (one level, no deeper); one path per line.
const DISCOVER = 'cd "$1" 2>/dev/null || exit 0; git rev-parse --show-toplevel 2>/dev/null; for d in */; do [ -e "${d}.git" ] && echo "$PWD/${d%/}"; done';
const FIELDS = "number,title,author,isDraft,headRefName,url,reviewDecision,statusCheckRollup,updatedAt";

function find(node, id) {
  if (node?.id === id) return node;
  for (const child of node?.children ?? []) {
    const found = find(child, id);
    if (found) return found;
  }
  return null;
}
// The copy stays alive while hidden, so the timer asks whether the panel is on screen.
function shown() {
  const root = layout(), panel = find(root, "panel"), body = find(root, "panel-body");
  return Boolean(panel && !panel.hidden && body?.active === "prs");
}

function checks(rollup) {
  if (!rollup?.length) return null;
  let pending = false;
  for (const c of rollup) {
    const result = c.conclusion || c.state;
    if (["FAILURE", "ERROR", "TIMED_OUT", "CANCELLED", "STARTUP_FAILURE"].includes(result)) return "fail";
    if (c.status ? c.status !== "COMPLETED" : result === "PENDING" || result === "EXPECTED") pending = true;
  }
  return pending ? "pending" : "pass";
}

function ago(iso) {
  const s = Math.max(0, (Date.now() - Date.parse(iso)) / 1000);
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))}m`;
  if (s < 86400) return `${Math.round(s / 3600)}h`;
  if (s < 86400 * 30) return `${Math.round(s / 86400)}d`;
  return `${Math.round(s / 86400 / 30)}mo`;
}

export default class Prs extends View {
  init(_props, cx) {
    this.groups = []; this.repoCount = 0; this.more = 0; this.filter = "all"; this.error = null; this.cache = {};
    let kept = [];
    try { kept = JSON.parse(localStorage.getItem("folded") ?? "[]"); } catch {}
    this.folded = new Set(kept);
    this.refresh(cx);
    cx.timer.every(60000, (cx) => { if (shown()) this.refresh(cx, true); });
  }

  // Switching tabs only changes what is shown: a fetch runs when the folder's data is older than STALE or force is set.
  refresh(cx, force) {
    const { cwd, on } = location(), filter = this.filter, context = key(filter);
    if (context !== this.context) {
      const hit = this.cache[context];
      this.context = context; this.groups = hit?.groups ?? []; this.repoCount = hit?.repoCount ?? 0; this.more = hit?.more ?? 0; this.error = hit?.error ?? null; this.loading = false;
    }
    const hit = this.cache[context];
    if (!cwd || this.loading || !shown() || (!force && hit && Date.now() - hit.at < STALE)) return;
    this.loading = true;
    const extra = filter === "mine" ? ["--author", "@me"] : filter === "review" ? ["--search", "review-requested:@me"] : [];
    cx.spawn(async (cx) => {
      try {
        const found = await exec("sh", ["-c", DISCOVER, "sh", cwd], { cwd, on, timeout: 15000 });
        const all = [...new Set(found.stdout.split("\n").map((l) => l.trim()).filter(Boolean))];
        const dirs = all.slice(0, MAX_REPOS), more = all.length - dirs.length;
        // Each repo's open PRs; one that isn't on GitHub is skipped, any other failure is remembered.
        const results = [];
        for (let i = 0; i < dirs.length; i += BATCH) {
          results.push(...await Promise.all(dirs.slice(i, i + BATCH).map(async (dir) => {
            const r = await exec("gh", ["pr", "list", "--state", "open", "--limit", "30", "--json", FIELDS, ...extra], { cwd: dir, on });
            return { dir, r };
          })));
        }
        if (key(this.filter) !== context) return;
        const groups = [], failures = [];
        for (const { dir, r } of results) {
          if (r.code !== 0) {
            if (!/not a git repository|none of the git remotes|no git remotes|could not determine/i.test(r.stderr)) failures.push(r.stderr.trim() || "gh failed");
            continue;
          }
          const prs = JSON.parse(r.stdout || "[]").sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
          const name = /github\.com\/([^/]+\/[^/]+)\/pull\//.exec(prs[0]?.url ?? "")?.[1] ?? dir.split("/").pop();
          if (!prs.length) continue;
          // Two folders on the same GitHub repo (a clone and a worktree, say) are one group, each PR once.
          const same = groups.find((g) => g.name === name);
          if (same) same.prs.push(...prs.filter((pr) => !same.prs.some((x) => x.number === pr.number)));
          else groups.push({ name, dir, prs });
        }
        for (const g of groups) g.prs.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
        groups.sort((a, b) => Date.parse(b.prs[0].updatedAt) - Date.parse(a.prs[0].updatedAt));
        this.groups = groups; this.repoCount = dirs.length; this.more = more;
        this.error = !dirs.length ? "No git repository here, or one level below" : (!groups.length && failures.length ? failures[0] : null);
        this.cache[context] = { groups, repoCount: dirs.length, more, error: this.error, at: Date.now() };
      } catch (e) { if (key(this.filter) === context) this.error = String(e); }
      finally { if (this.context === context) this.loading = false; cx.notify(); }
    });
  }

  setFilter(filter, cx) { this.filter = filter; this.refresh(cx); cx.notify(); }

  toggle(name, cx) {
    this.folded.has(name) ? this.folded.delete(name) : this.folded.add(name);
    try { localStorage.setItem("folded", JSON.stringify([...this.folded])); } catch {}
    cx.notify();
  }

  // A repo's header: its name and how many PRs it has; it folds the group.
  header(g, t) {
    const open = !this.folded.has(g.name);
    return h_flex().id(`repo-${g.name}`).h(28).flex_none().px(10).mt(4).gap(8).items_center().rounded(7).cursor_pointer().hover((s) => s.bg(t.hover))
      .on_click((_e, cx) => this.toggle(g.name, cx))
      .child(svg(`mods/workspace-chrome/chevron-${open ? "down" : "right"}.svg`).size(11).flex_none().text_color(t.dim))
      .child(div().flex_1().min_w(0).truncate().text_size(12).font_semibold().text_color(t.foreground).child(g.name))
      .child(div().flex_none().text_size(11).text_color(t.dim).child(String(g.prs.length)));
  }

  row(pr, t, g) {
    const state = checks(pr.statusCheckRollup);
    const dot = { pass: t.ansi2, fail: t.ansi1, pending: t.blocked }[state];
    const review = { APPROVED: ["✓ approved", t.ansi2], CHANGES_REQUESTED: ["± changes", t.ansi1], REVIEW_REQUIRED: ["review", t.muted] }[pr.reviewDecision];
    const open = window()?.platform === "macos" ? "open" : window()?.platform === "windows" ? "explorer" : "xdg-open";
    return v_flex().id(`pr-${g.name}-${pr.number}`).flex_none().px(10).py(7).gap(3).rounded(7).cursor_pointer().hover((s) => s.bg(t.hover))
      .on_click(() => { exec(open, [pr.url]).catch(() => {}); })
      .child(h_flex().gap(8).items_center()
        .child(div().w(8).h(8).flex_none().rounded(4).bg(dot ?? t.dim + "55"))
        .child(div().flex_1().min_w(0).truncate().text_color(pr.isDraft ? t.muted : t.foreground).child(pr.title))
        .child(div().flex_none().text_size(11).text_color(t.dim).child(`#${pr.number}`)))
      .child(h_flex().gap(8).pl(16).items_center().text_size(11).text_color(t.dim)
        .child(div().flex_1().min_w(0).truncate().child(`${pr.headRefName} · ${pr.author?.login ?? ""} · ${ago(pr.updatedAt)}`))
        .when(pr.isDraft, (e) => e.child(div().flex_none().px(5).rounded(4).border_1().border_color(t.border).child("draft")))
        .when(Boolean(review), (e) => e.child(div().flex_none().text_color(review[1]).child(review[0]))));
  }

  render(cx) {
    this.refresh(cx);
    const t = theme(), total = this.groups.reduce((n, g) => n + g.prs.length, 0), grouped = this.repoCount > 1;
    const rows = this.groups.flatMap((g) => grouped ? [this.header(g, t), ...(this.folded.has(g.name) ? [] : g.prs.map((pr) => this.row(pr, t, g)))] : g.prs.map((pr) => this.row(pr, t, g)));
    return v_flex().id("prs").size_full().min_h(0).rounded(10).overflow_hidden().bg(t.background).border_1().border_color(t.border).text_color(t.foreground).text_size(13)
      .child(h_flex().h(42).flex_none().px(14).gap(8).items_center().border_b(1).border_color(t.border)
        .child(div().font_semibold().child("Pull requests"))
        .child(div().flex_1().min_w(0).truncate().text_size(11).text_color(t.dim).child(this.repoCount > 1 ? `${total} open · ${this.groups.length} ${this.groups.length === 1 ? "repo" : "repos"}` : (this.groups[0]?.name ?? "")))
        .child(div().id("prs-refresh").flex_none().px(6).py(2).rounded(5).text_size(12).text_color(t.muted).cursor_pointer().hover((s) => s.bg(t.hover))
          .on_click((_e, cx) => { this.refresh(cx, true); cx.notify(); }).child(this.loading ? "…" : "↻")))
      .child(h_flex().flex_none().px(10).py(6).gap(4).border_b(1).border_color(t.border).children(FILTERS.map(([id, label]) =>
        div().id(`prs-filter-${id}`).px(8).py(3).rounded(6).text_size(12).cursor_pointer().bg(this.filter === id ? t.selected : t.background)
          .text_color(this.filter === id ? t.foreground : t.muted).hover((s) => s.bg(t.hover)).on_click((_e, cx) => this.setFilter(id, cx)).child(label))))
      .child(div().flex_1().min_h(0).relative()
        .child(v_flex().id("prs-list").absolute().inset_0().overflow_y_scroll().p(6).gap(2).children(rows)
          .when(this.more > 0, (e) => e.child(div().px(10).py(6).text_size(11).text_color(t.dim).child(`+${this.more} more repos not shown`)))
          .when(!rows.length, (e) => e.child(div().p(8).text_color(this.error && !/^No git repository/.test(this.error) ? t.ansi1 : t.dim)
            .child(this.error || (this.loading ? "Loading pull requests…" : grouped ? `No open pull requests in ${this.repoCount} folders` : "No open pull requests")))))
        .child(Scrollbar.vertical("prs-list").absolute().inset_0()));
  }
}
