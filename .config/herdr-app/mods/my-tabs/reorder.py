#!/usr/bin/env python3
"""Reorders the right panel's blocks in a layout file, then reapplies it.
Usage: reorder.py <layout.json> <visible,ids> <id>...   (ids in the new order)
Herdr has no command to move a layout child, so the file is rewritten (layout.set would drop root fields
like terminal_menu) and layout.switch reloads it; the panels that were showing are shown again."""
import json, subprocess, sys

path, visible, order = sys.argv[1], [v for v in sys.argv[2].split(",") if v], sys.argv[3:]
layout = json.load(open(path))

def body(node):
    if node.get("id") == "panel-body":
        return node
    for child in node.get("children") or []:
        found = body(child)
        if found:
            return found

panel = body(layout)
panel["children"].sort(key=lambda c: order.index(c["id"]) if c["id"] in order else len(order))
with open(path, "w") as f:
    json.dump(layout, f, indent=2, ensure_ascii=False)
    f.write("\n")

def do(command, args):
    subprocess.run(["herdr-app", "do", command, json.dumps(args)], capture_output=True)

do("layout.switch", {"name": layout["id"] if layout["id"] != "root" else "my-main"})
for child in panel["children"]:
    do("layout.show" if child["id"] in visible else "layout.hide", {"id": child["id"]})
do("layout.show" if visible else "layout.hide", {"id": "panel"})
