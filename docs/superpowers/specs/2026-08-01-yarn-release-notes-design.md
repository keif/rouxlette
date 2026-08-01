# Design: `yarn release` — local, one-command releases with generated notes

**Date:** 2026-08-01
**Status:** Approved (design); pending implementation plan
**Author:** Engineering

## Problem

The app has a complete EAS release configuration (build profiles, expo-updates OTA,
store submission) but **no release-notes or changelog mechanism**: no git tags, no
GitHub Releases, no CHANGELOG, and CI runs tests only. Release history exists only as
conventional-commit messages and internal `_notes/end-session-*.md` logs, neither of
which is a published, user-facing record.

## Goal

One local command cuts a release end to end and publishes a GitHub Release whose notes
are generated automatically from history:

```
yarn release <patch|minor|major>   # bump defaults to patch
yarn release patch --dry-run       # preview everything, mutate nothing
```

## Non-goals

- **No CI automation.** Releases run locally, matching the project's "no shipping
  through CI" philosophy (same rationale as the codex review gate). No workflow, no
  release token in Actions.
- **Not an OTA tool.** This marks a *native* release boundary (version bump). OTA-only
  JS pushes keep the version and use `eas update` — out of scope here.
- **No EAS build/submit orchestration.** This publishes the GitHub Release + notes
  only. Triggering `eas build` / `eas submit` stays a separate manual step.

## Key decisions (settled during brainstorming)

1. **Where it runs:** local script (`yarn release`), not GitHub Actions.
2. **Notes source:** GitHub's native PR-based auto-notes **plus** a conventional-commit
   fallback, because this repo sometimes commits directly to `main` (not only via PRs)
   and PR-based notes would miss those.

## Architecture

Four artifacts:

| File | Purpose |
|---|---|
| `scripts/release.js` | Node orchestrator (matches existing `scripts/*.js` convention). Pure logic split from side effects for testability. |
| `.github/release.yml` | GitHub notes categorization config — groups PRs into **Features / Fixes / Dependencies / Other** by label. |
| `scripts/__tests__/release.test.js` | Jest unit tests for the pure logic. |
| `package.json` | adds `"release": "node scripts/release.js"`. |

### `scripts/release.js` structure

Pure, unit-tested functions (no I/O):

- `computeNextVersion(current, bump)` → next semver string. Validates `bump ∈
  {patch, minor, major}`; throws on malformed current version.
- `bumpAppJsonVersion(appJsonText, nextVersion)` → new file text with `expo.version`
  replaced, **preserving 2-space indentation and trailing newline** (string-level
  edit, not `JSON.parse`/`stringify`, to avoid reformatting the whole file).
- `buildNotesBody(githubNotes, commitLines)` → final release body: GitHub's generated
  notes followed by a `### Commits` section. Returns just the GitHub notes when there
  are no extra commit lines.
- `filterConventionalCommits(rawLog)` → keeps `feat|fix|perf|refactor|docs|chore|
  test|build|ci(...)` lines, **drops the `chore(release):` commit** (it's noise in its
  own release).

Thin `main()` orchestrator (side effects; exercised via `--dry-run`, not mocked):

1. **Preflight** (abort on any failure, before mutating anything):
   - on branch `main`
   - working tree clean
   - `gh auth status` OK
   - `git fetch` then not behind `origin/main`
   - `yarn jest --watchAll=false --ci` passes
2. Read `app.json`, compute next version, rewrite `expo.version`.
3. `git add app.json && git commit -m "chore(release): vX.Y.Z"`.
4. `git tag vX.Y.Z`.
5. `git push --follow-tags origin main`.
6. Build notes body:
   - `previousTag` = most recent tag before the new one (`git describe --tags
     --abbrev=0 vX.Y.Z^`, empty if none).
   - GitHub notes via `gh api repos/{owner}/{repo}/releases/generate-notes -f
     tag_name=vX.Y.Z [-f previous_tag_name=<prev>]` → `.body`.
   - Commit fallback = `filterConventionalCommits(git log <prev>..HEAD --pretty)`
     (from root when no previous tag).
   - `buildNotesBody(...)`.
7. `gh release create vX.Y.Z --title vX.Y.Z --notes-file <combined>`.

### `--dry-run`

Runs preflight, then prints the computed version, tag name, and fully-rendered notes
body. Performs **no** commit, tag, push, or release create. Lets the user eyeball the
notes before anything becomes permanent.

## Data flow

`yarn release <bump>` → preflight gate → version bump (app.json) → commit + tag + push
→ assemble notes (GitHub API notes + filtered commit log) → `gh release create`.

Version note: `app.json` `version` drives `runtimeVersion.policy: appVersion`, so a
release marks a native-build boundary. The script header documents this so nobody
reaches for `yarn release` when they meant an OTA `eas update`.

## Error handling

- Any preflight check fails → print the specific reason and exit non-zero **before**
  touching files. No partial state.
- `gh`/`git` command failure mid-run → surface stderr and exit non-zero; the operator
  finishes or unwinds manually (e.g. delete a local tag). The script does not attempt
  automatic rollback of a push.
- Invalid `bump` argument or unparseable current version → fail fast with a clear
  message.
- First-ever release (no prior tag) → notes generated from repository start; commit
  fallback covers the full history filtered to conventional commits.

## Testing

Jest unit tests on the pure functions (real code, no mocks):

- `computeNextVersion`: patch/minor/major transitions; rejects bad `bump`; rejects
  malformed version.
- `bumpAppJsonVersion`: replaces version; preserves indentation + trailing newline;
  leaves unrelated keys untouched.
- `buildNotesBody`: appends `### Commits`; omits the section when no extra commits.
- `filterConventionalCommits`: keeps conventional types; drops `chore(release):`;
  drops non-conforming lines.

Side-effecting `main()` is validated manually via `--dry-run` (and the first real
release), not by mocking `git`/`gh`.

## Rollout

1. Implement + tests green.
2. Dry-run on the current `main` to eyeball the first-release notes.
3. First real release: `yarn release patch` → `v1.0.1` (captures the recently pushed
   storage fixes + dep cleanup).
