---
name: brewfile-audit
description: Audit ./Brewfile against what is actually installed (formulae, casks, taps, Mac App Store) and sync the drift. Use when the user asks what's missing from or extra to the Brewfile, to add/remove entries so it matches the machine, or "do the brew audit again".
---

# Brewfile audit

Two-way diff between `Brewfile` (repo root) and the machine. Read-only until the user picks what to change.

## 1. Collect

Run from the repo root, `HOMEBREW_NO_AUTO_UPDATE=1` set:

```sh
brew bundle check --verbose --no-upgrade --file ./Brewfile    # listed, not installed
brew bundle cleanup --file ./Brewfile | sed '/^Would `brew cleanup`/,$d'   # installed, not listed (dry run)
brew leaves --installed-on-request                            # what the user chose vs pulled-in deps
mas list; grep '^mas ' Brewfile                               # App Store side
```

`cleanup` is a dry run only. `--force` uninstalls everything extra: run it only on an explicit request naming it.

For each extra formula not in `brew leaves --installed-on-request`, find its parent with `brew uses --installed <name>`.

For a cask listed as missing, check `/Applications` too. It may be installed outside Homebrew; say so.

## 2. Report

Two sections, **Homebrew** and **Mac App Store**, each with:

- **In the Brewfile but not installed**
- **Installed but not in the Brewfile**: split into formulae the user installed, dependencies (grouped under the parent that pulled them in, noting they go away with it), casks, taps.

Write "nothing" for an empty bucket. Every App Store app is shown with its id.

When the user asks what entries are, get one-line descriptions from `brew info --json=v2 <names> | jq -r '.formulae[]|"\(.name): \(.desc)"'` (casks: `--cask`, `.casks[]`, `.token`). `brew desc --eval-all` is disabled on this machine.

## 3. Sync (only the entries the user names)

- Insert alphabetically by bare name (ignore the `tap/` prefix) in the matching section: `# --- Taps ---`, `# --- Formulae ---`, `# --- Casks ---`, `# --- Mac App Store ---` as `mas "Name", id: N`.
- Write a third-party formula or cask with its full `user/tap/name`. Bare names only resolve while that tap stays tapped.
- Add dependencies only via their parent.
- Delete lines for removed entries; uninstall nothing.

Done when both commands report clean, or the leftover drift is exactly what the user chose to keep:

```sh
brew bundle check --no-upgrade --file ./Brewfile    # "dependencies are satisfied"
brew bundle cleanup --file ./Brewfile               # no uninstall/untap lines
```

Then show `git diff Brewfile`. Commit when asked, staging `Brewfile` alone with a `chore(brew): ...` message.
