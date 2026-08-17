# AGENTS.md

## Project overview

This repository is for **JP Menus**, a mobile-first Leptos web app for memorizing Japanese restaurant menu vocabulary. The first catalog is sushi restaurant terminology. Read `plan.md` before implementation or architectural changes; it is the product and acceptance-criteria source of truth.

Codex uses `AGENTS.md` for repository instructions. This is the equivalent project-level role that `CLAUDE.md` commonly fills in Claude Code.

## Current status

- The first complete sushi-learning MVP is implemented.
- The embedded catalog contains 317 items across 16 categories.
- Rust checks, the WASM build, the Tailwind release bundle, and Playwright interaction tests are configured and passing.
- Keep `plan.md` and this file aligned when product or architecture decisions change.

## Product invariants

- The UI is mobile-only in composition. On desktop, center an app canvas no wider than 480px; do not expand into a desktop dashboard.
- Use a semantic table with three study columns: Japanese term, reading, and Korean meaning, plus a narrow mastery-control column.
- Keep the table column header sticky while scrolling.
- Tapping/clicking a study-column header hides only that column's body values. Keep the header, column width, cell dimensions, and row height unchanged.
- Column concealment is ephemeral and starts fully visible on every new page load.
- The mastery control has its own fixed-width cell and must never overlap vocabulary text.
- A mastered row is dimmed in place, remains reversible, and keeps its original order.
- Persist mastered item IDs in browser local storage. A missing or malformed stored value must not prevent startup.
- Optimize for calm, legible study. Avoid decorative clutter, aggressive animation, gradients, and unrelated dashboard widgets.
- Preserve keyboard and screen-reader operation as well as touch operation.

## Technical baseline

- Rust stable, compiling to `wasm32-unknown-unknown`.
- Leptos 0.8 CSR with Trunk. Use the current compatible 0.8 patch and commit `Cargo.lock`.
- Use `serde`/`serde_json` for catalog data and `gloo-storage` for progress persistence.
- Use Tailwind CSS 4 through Trunk's built-in `tailwind-css` asset pipeline. Keep custom CSS limited to theme tokens, base rules, and behavior that utilities cannot express clearly. Do not introduce a component framework, an icon dependency, a router, SSR, or a backend without a concrete requirement and explicit update to `plan.md`.
- Keep `main.rs` limited to startup concerns and mounting `App`.
- Prefer feature-first modules under `src/features/study/`; keep shared abstractions thin and earned by actual reuse.
- Keep source catalog data in `data/sushi.json` and embed it with `include_str!` for deterministic startup.

## Data rules

- Treat `data/sushi.json` as authored source data, not generated UI state.
- Stable item IDs are persistence keys. Never rename an existing ID merely to improve wording; add a deliberate migration if a released ID must change.
- Prefer the form actually seen on Japanese menus. Do not invent or promote obscure kanji just to fill the Japanese-term column; normal kana is valid.
- Store readings primarily in hiragana and concise Korean menu meanings in `meaning_ko`.
- Put alternate Japanese spellings in `aliases` instead of adding duplicate rows.
- Distinguish fish species, cuts, preparation methods, and dish formats. Use `note_ko` when Korean common names are ambiguous.
- Maintain at least 15 categories and 250 unique items for the initial complete catalog.
- Every catalog change must pass parsing, required-field, enum, minimum-count, and ID-uniqueness tests.

## State boundaries

- `StudyState` owns interactive page state and exposes intention-revealing operations such as `toggle_column`, `toggle_mastered`, and `reset_progress`.
- Use derived signals/memos for filtered rows and counts; do not duplicate derived values in writable state.
- Isolate local-storage serialization and error handling in `storage.rs`, not individual view components.
- Persist only durable study progress by default. Search text, selected filters, and concealed columns are session UI state unless `plan.md` is deliberately revised.

## UI and accessibility rules

- Use actual `<table>`, `<thead>`, `<tbody>`, `<th scope="col">`, and button elements.
- Implement concealed cell content with a wrapper and `visibility: hidden`, not `display: none`, conditional row removal, zero width, or transparent text that remains selectable.
- Keep column-header toggle labels visible and expose toggle state with `aria-pressed` and a visible state cue.
- Touch targets should be at least 44×44px even if the visible icon is smaller.
- Provide strong `:focus-visible` styles and support `prefers-reduced-motion`.
- Verify 320px, 375px, 430px, 480px, and a wide desktop viewport. There must be no horizontal page overflow at mobile widths.
- Do not fetch webfonts for the MVP. Use the system Japanese/Korean font stack specified in `plan.md`.

## Expected structure

Follow the proposed tree in `plan.md`. Important boundaries are:

- `src/app.rs`: app shell and context composition.
- `src/data/sushi.rs`: compile-time catalog embedding and parsing.
- `src/features/study/model.rs`: serializable domain types.
- `src/features/study/state.rs`: reactive state and derived values.
- `src/features/study/storage.rs`: persistence adapter.
- `src/features/study/components/`: focused UI components.
- `styles/tailwind.css`: Tailwind entry point, theme tokens, base rules, and small custom behavior rules.
- `tests/data_contract.rs`: catalog integrity tests.

Do not create empty placeholder modules solely to match the full tree. Add a file when its phase is being implemented.

## Work sequence

1. Read `plan.md` and inspect the current tree and worktree status.
2. Implement the smallest complete phase or user-requested vertical slice.
3. Preserve unrelated user changes.
4. Add or update tests with behavior changes, especially data and persistence changes.
5. Run the relevant checks below and report exactly which checks ran and their outcomes.
6. Update `plan.md` checkboxes only for work that is actually complete and verified.

## Verification commands

Once the project is scaffolded, the intended baseline is:

```powershell
cargo fmt --all -- --check
cargo clippy --all-targets --all-features -- -D warnings
cargo test --all
cargo check --target wasm32-unknown-unknown
trunk build --release
```

Use `trunk serve` for manual UI verification. If the actual manifest or platform requires an adjusted command, use the working command and update this section. Never claim an unexecuted command passed.

For behavior affecting layout or interaction, verify in a real browser at the target viewports. Unit tests alone are not sufficient for sticky positioning, preserved column geometry, touch targets, focus, or local-storage restoration.

## Change discipline

- Keep dependencies minimal and explain any new production dependency in the change summary.
- Keep Rust warnings clean; do not broadly suppress Clippy or compiler warnings.
- Avoid `unwrap`/`expect` for user-controlled or persisted data. Static embedded catalog failure may surface clearly during development, but contract tests should catch it before release.
- Do not silently rewrite Japanese readings or Korean meanings during unrelated code work.
- If implementation reveals that a product invariant is infeasible, document the evidence and revise `plan.md` before changing the behavior.
