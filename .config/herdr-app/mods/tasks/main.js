// A task list per project (a space's folder, on its machine): checkboxes, double-click a task to edit it, open tasks
// on top in the order they were added, done ones below with the latest finished first. Kept in shared state "tasks".

import { View, div, svg } from "gpui-kit";
import { v_flex, h_flex, InputState, Input } from "gpui-base";
import { spaces, theme, settings, shared, setShared } from "herdr";

const KEY = "tasks";

function project() {
  const space = spaces().find((s) => s.active);
  return space ? { key: `${space.machine ?? ""}:${space.folder ?? space.id}`, name: space.name } : null;
}
const all = () => shared(KEY) ?? {};
const list = (key) => all()[key] ?? [];
const save = (key, tasks) => setShared(KEY, { ...all(), [key]: tasks });

// Open first (oldest first, so the list doesn't jump while you work), then done (latest finished first).
function sorted(tasks) {
  const open = tasks.filter((t) => !t.done).sort((a, b) => a.at - b.at);
  const done = tasks.filter((t) => t.done).sort((a, b) => (b.doneAt ?? 0) - (a.doneAt ?? 0));
  return [...open, ...done];
}

export default class Tasks extends View {
  init(_props, cx) {
    this.editing = null;   // { key, id } of the task being edited
    this.add = InputState.new({ placeholder: "Add a task…" });
    this.add.on("submit", (_e, cx) => {
      const p = project(), text = this.add.value().trim();
      if (!p || !text) return;
      save(p.key, [...list(p.key), { id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`, text, done: false, at: Date.now() }]);
      this.add.set_value("");
      cx.notify();
    });
    this.edit = InputState.new({});
    this.edit.on("submit", (_e, cx) => this.finish(true, cx));
    this.edit.on("blur", (_e, cx) => this.finish(true, cx));
  }

  update(key, id, patch) { save(key, list(key).map((t) => (t.id === id ? { ...t, ...patch } : t))); }

  begin(key, task, cx) {
    this.editing = { key, id: task.id };
    this.edit.set_value(task.text);
    this.edit.focus();
    cx.notify();
  }

  // Leaves edit mode; saves the text when asked (blank text removes the task, as in most lists).
  finish(keep, cx) {
    const at = this.editing;
    if (!at) return;
    this.editing = null;
    const text = this.edit.value().trim();
    if (keep && text) this.update(at.key, at.id, { text });
    else if (keep) save(at.key, list(at.key).filter((t) => t.id !== at.id));
    cx.notify();
  }

  row(p, task, t, cx) {
    const editing = this.editing?.key === p.key && this.editing.id === task.id;
    return h_flex().id(`task-${task.id}`).gap(9).px(6).py(5).rounded(6).items_start().hover((s) => s.bg(t.hover))
      .child(div().id(`check-${task.id}`).flex_none().mt(1).cursor_pointer()
        .on_click(() => this.update(p.key, task.id, task.done ? { done: false, doneAt: null } : { done: true, doneAt: Date.now() }))
        .child(task.done ? svg("mods/tasks/check.svg").size(16).text_color(t.ansi2) : div().size(16).rounded(4).border_1().border_color(t.dim)))
      .child(editing
        ? h_flex().flex_1().min_w(0).h(26).px(8).items_center().rounded(6).border_1().border_color(t.accent).bg(t.background)
          .on_key_down((e, cx) => { if (e.key === "escape") this.finish(false, cx); })
          .child(Input.new(this.edit).flex_1().h_full().text_size(12.5).text_color(t.foreground))
        : div().id(`text-${task.id}`).flex_1().min_w(0).text_color(task.done ? t.dim : t.foreground)
          .when(task.done, (el) => el.line_through())
          .on_click((e, cx) => { if (e.click_count === 2) this.begin(p.key, task, cx); })
          .child(task.text))
      .child(div().id(`del-${task.id}`).flex_none().px(5).rounded(4).text_color(t.dim).cursor_pointer().hover((s) => s.bg(t.raised).text_color(t.foreground))
        .tooltip("Delete").on_click((_e, cx) => { save(p.key, list(p.key).filter((x) => x.id !== task.id)); cx.notify(); }).child("×"));
  }

  render(cx) {
    const t = theme(), mono = settings().font_family ?? "JetBrains Mono", p = project();
    const tasks = p ? sorted(list(p.key)) : [], open = tasks.filter((x) => !x.done).length, done = tasks.length - open;
    return v_flex().id("tasks").size_full().min_h(0).rounded(10).overflow_hidden().bg(t.background).border_1().border_color(t.border).text_color(t.foreground).text_size(12.5).font_family(mono)
      .child(h_flex().h(42).flex_none().px(14).gap(8).items_center().border_b(1).border_color(t.border)
        .child(svg("mods/tasks/check.svg").size(15).flex_none().text_color(t.muted))
        .child(div().font_semibold().child("Tasks"))
        .child(div().flex_1().min_w(0).truncate().text_size(11).text_color(t.dim).child(p ? `${p.name} · ${open} open${done ? `, ${done} done` : ""}` : ""))
        .when(done > 0, (el) => el.child(div().id("tasks-clear").flex_none().px(6).py(2).rounded(5).text_size(11).text_color(t.muted).cursor_pointer().hover((s) => s.bg(t.hover))
          .tooltip("Remove the done tasks").on_click((_e, cx) => { save(p.key, list(p.key).filter((x) => !x.done)); cx.notify(); }).child("Clear done"))))
      .child(h_flex().flex_none().mx(12).mt(12).h(32).px(10).items_center().rounded(8).border_1().border_color(t.border).bg(t.background)
        .child(Input.new(this.add).flex_1().h_full().text_size(12.5).text_color(t.foreground)))
      .child(v_flex().id("tasks-body").flex_1().min_h(0).overflow_y_scroll().p(10).gap(2)
        .when(!p, (el) => el.child(div().p(4).text_color(t.dim).child("No project.")))
        .when(Boolean(p) && !tasks.length, (el) => el.child(div().p(4).text_size(11).text_color(t.dim).child("Nothing to do here yet. Type a task above and press Enter.")))
        .children(tasks.map((task) => this.row(p, task, t, cx))));
  }
}
