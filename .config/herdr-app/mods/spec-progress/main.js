// Spec interviews, as a panel: every agent that reports `spec.answered` / `spec.total` labels on its terminal
// (scripts/spec-progress sets them) gets a block bar and "answered N of M, K left". The total can change any time.

import { View, div, svg } from "gpui-kit";
import { v_flex, h_flex } from "gpui-base";
import { run, terminals, theme, settings } from "herdr";

const MAX_CELLS = 30;

function interviews() {
  return terminals()
    .map((t) => ({ t, total: parseInt(t.labels?.["spec.total"], 10), answered: parseInt(t.labels?.["spec.answered"], 10) || 0 }))
    .filter((i) => i.total > 0 && !["exited", "dead"].includes(i.t.state));
}

export default class SpecProgress extends View {
  card(i, theme_, mono) {
    const t = theme_, total = i.total, answered = Math.min(i.answered, total), left = total - answered, done = left === 0;
    const color = done ? t.ansi2 : t.ansi4;
    // Past MAX_CELLS the bar stays that wide and each block stands for several questions.
    const cells = Math.min(total, MAX_CELLS), filled = Math.round((answered / total) * cells);
    const name = i.t.labels?.where ?? i.t.name ?? i.t.address, title = i.t.labels?.["spec.title"];
    return v_flex().id(`spec-${i.t.address}`).gap(6).p(10).rounded(8).bg(t.raised).cursor_pointer().hover((s) => s.bg(t.hover))
      .on_click(() => run("agent.focus", { terminal: i.t.address }))
      .child(h_flex().items_baseline().gap(8)
        .child(div().flex_1().min_w(0).truncate().text_color(t.foreground).font_semibold().child(title || name))
        .child(div().text_color(color).font_semibold().child(`${answered}/${total}`)))
      .child(h_flex().gap(3).children(Array.from({ length: cells }, (_, k) => div().flex_1().h(9).rounded(2)
        .when(k < filled, (el) => el.bg(color))
        .when(k >= filled, (el) => el.border_1().border_color(t.dim)))))
      .child(h_flex().gap(8).text_size(11).text_color(t.dim)
        .child(div().flex_1().min_w(0).truncate().child(title ? name : ""))
        .child(div().text_color(done ? t.ansi2 : t.muted).child(done ? `all ${total} answered` : `answered ${answered} of ${total}, ${left} left`)));
  }

  render() {
    const t = theme(), mono = settings().font_family ?? "JetBrains Mono", list = interviews();
    return v_flex().id("spec-progress").size_full().min_h(0).rounded(10).overflow_hidden().bg(t.background).border_1().border_color(t.border).text_color(t.foreground).text_size(12.5).font_family(mono)
      .child(h_flex().h(42).flex_none().px(14).gap(8).items_center().border_b(1).border_color(t.border)
        .child(svg("mods/spec-progress/list.svg").size(15).flex_none().text_color(t.muted))
        .child(div().font_semibold().child("Spec"))
        .child(div().flex_1().text_size(11).text_color(t.dim).child(list.length ? `${list.length} interview${list.length > 1 ? "s" : ""}` : "")))
      .child(v_flex().id("spec-body").flex_1().min_h(0).overflow_y_scroll().p(12).gap(10)
        .when(!list.length, (el) => el.child(v_flex().gap(4)
          .child(div().text_color(t.dim).child("No spec interviews running."))
          .child(div().text_size(11).text_color(t.dim).child("An agent shows up here once it runs scripts/spec-progress."))))
        .children(list.map((i) => this.card(i, t, mono))));
  }
}
