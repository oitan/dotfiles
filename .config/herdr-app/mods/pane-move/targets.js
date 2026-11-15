// Where a pane can be sent (copied in pane-move: a mod cannot import another): the spaces on its terminal's machine, each with the tabs it could join.
import { spaces } from "herdr";

export const HEAD = 24, ITEM = 30, CHROME = 40, MAX = 360;

// "algatop_team/t5" -> "algatop_team"; a bare address is this computer (null).
const machineOf = (address) => (address?.includes("/") ? address.split("/")[0] : null);

// [{ space, tabs }]: the pane's own tab is left out (it is already there), settled tabs are put away.
export function targets(p) {
  const from = machineOf(p.terminal);
  return spaces().filter((s) => (s.machine ?? null) === from).map((space) => ({ space, tabs: space.tabs.filter((t) => t.id !== p.tab && !t.settled) }));
}

// A popup's height is fixed when it opens: one header and a "New tab" row per space, then a row per tab.
export function sendHeight(p) {
  const rows = targets(p).reduce((h, g) => h + HEAD + ITEM * (1 + g.tabs.length), 0);
  return Math.min(rows, MAX) + CHROME;
}
