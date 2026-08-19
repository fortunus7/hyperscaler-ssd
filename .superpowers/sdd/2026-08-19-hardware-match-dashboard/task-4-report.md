# Task 4 Report: Primary dashboard affordance and accessibility

## Status

Complete. The primary `Home` shell now uses repository-local CSS treatments only, exposes explicit accessible control state, blocks a fourth comparison without evicting an existing selection, provides search result and empty-state feedback, and uses a single sticky mobile navigation surface.

No commit was created.

## Files changed

- `shared/profileSelection.ts`
  - Added the pure `updateProfileSelection` transition helper.
  - A selected ID is always removable.
  - A new ID is appended below the limit.
  - A new ID at the limit returns the existing IDs and `blocked: true`.
- `shared/profileSelection.test.ts`
  - Added three regression cases covering the blocked fourth selection, removal at the limit, and addition below the limit.
- `client/src/pages/Home.tsx`
  - Integrated `updateProfileSelection` with a visible polite live-region notice instead of silent first-item eviction.
  - Added `aria-pressed` and `aria-controls` to comparison, region, and metric controls.
  - Added `aria-expanded` and `aria-controls` to the retained sticky mobile menu, plus 44px minimum menu targets.
  - Unified the profile metrics and visible `프로파일 보기` CTA inside one real detail button; the compare toggle remains a separate button.
  - Added a visible result count and a zero-result explanation/reset action.
  - Removed the fixed bottom mobile dock.
  - Replaced all missing logo, hero, SSD, and thermal images with CSS-only marks/patterns.
  - Renumbered Home-owned flow labels after the matcher: public profiles `02`, comparison `03`, requirements `04`, observed patterns `05`, sources `06`.
- `client/src/index.css`
  - Added `--signal-action: #c94a24`.
  - Added a global three-pixel `:focus-visible` ring with offset.
  - Added the CSS-only brand mark and hero/hardware/thermal patterns.
- `client/index.html`
  - Removed `maximum-scale=1` from the viewport.
  - Removed the missing favicon reference.

## TDD evidence

### RED — before the helper existed

Command:

```text
corepack pnpm exec vitest run shared/profileSelection.test.ts
```

Result: exit `1`. Vitest failed to load `./profileSelection` because the helper did not exist yet. This established that the requested selection transition contract was absent before implementation.

### GREEN — after the minimal helper

Command:

```text
corepack pnpm exec vitest run shared/profileSelection.test.ts
```

Result: exit `0`; `1` test file and `3` tests passed.

Covered behaviors:

1. Adding a fourth ID at `limit = 3` returns the same IDs and `blocked: true`.
2. Removing an already selected ID at the limit succeeds with `blocked: false`.
3. Adding a new ID below the limit succeeds with `blocked: false`.

## Verification

### Focused regression

```text
corepack pnpm exec vitest run shared/profileSelection.test.ts
```

Exit `0`: `1` file passed, `3` tests passed.

### Full test suite

```text
corepack pnpm exec vitest run
```

Exit `0`: `12` files passed, `27` tests passed.

### Typecheck

```text
corepack pnpm check
```

Exit `0`: `tsc --noEmit` completed without diagnostics.

### Production build

```text
corepack pnpm build
```

Exit `0`: Vite transformed `1720` modules and built the client; esbuild produced `dist/index.js`.

The build continues to emit existing environment/configuration warnings for undefined analytics placeholders and the existing client chunk-size advisory. They do not fail the build and were outside the allowed Task 4 files/scope.

### Static acceptance scans

```text
rg -n "/manus-storage" client
```

No matches.

Additional scan confirmed no `maximum-scale=1`, favicon link, or fixed bottom-dock marker. Source inspection also confirmed the required signal token, global focus ring, ARIA state/control attributes, live regions, result count, reset action, and sequential Home-owned labels.

## Concerns

- No functional blockers remain.
- Visual browser smoke testing was not part of the required command set; validation is based on source acceptance scans, TypeScript, the full unit suite, and the production build.

## Fix round 1/5 — Important review findings

### Changes

- Updated the actual visible section flow to one coherent sequence:
  - `01 · HARDWARE MATCHER`
  - `02 · PUBLIC PROFILE INDEX`
  - `03 · SIDE-BY-SIDE COMPARISON`
  - `04 · SERVER PROFILE WORKBENCH`
  - `05 · INTERNAL CANDIDATE WORKBENCH`
  - `06 · SSD REQUIREMENT LENS`
  - `07 · OBSERVED PATTERNS`
  - `08 · SOURCE REGISTER`
- Moved the global `:focus-visible` rule from the base layer to the later utilities layer and made both the three-pixel signal outline and three-pixel offset `!important`.
- No workbench behavior or formatting was changed; only the two requested visible label literals were edited in those components.

### Root-cause evidence

- The workbench label scan showed stale legacy values (`ServerWorkbench` was `03`; `CandidateWorkbench` was `02`) between the already-correct Home labels.
- The global focus rule was originally in `@layer base`, while Tailwind-generated `outline-none` is a later utility at equal class/pseudo-class specificity. That ordering allowed the utility's `outline-style: none` to suppress the intended ring.

### Verification evidence

Focused regression:

```text
corepack pnpm exec vitest run shared/profileSelection.test.ts
```

Exit `0`: `1` file passed, `3` tests passed.

Full suite:

```text
corepack pnpm exec vitest run
```

Exit `0`: `12` files passed, `27` tests passed.

Typecheck:

```text
corepack pnpm check
```

Exit `0`: `tsc --noEmit` completed without diagnostics.

Production build:

```text
corepack pnpm build
```

Exit `0`: Vite transformed `1720` modules and built the client; esbuild produced `dist/index.js`. The same pre-existing analytics-placeholder and chunk-size warnings remain non-fatal.

Section-label scan:

```text
rg -n -- '01 · HARDWARE MATCHER|02 · PUBLIC PROFILE INDEX|03 · SIDE-BY-SIDE COMPARISON|04 · SERVER PROFILE WORKBENCH|05 · INTERNAL CANDIDATE WORKBENCH|06 · SSD REQUIREMENT LENS|07 · OBSERVED PATTERNS|08 · SOURCE REGISTER' client/src/components/HardwareMatcher.tsx client/src/pages/Home.tsx client/src/components/ServerWorkbench.tsx client/src/components/CandidateWorkbench.tsx
```

Result: all eight labels were found exactly once at the expected flow locations.

Compiled focus-cascade inspection after the production build found:

```text
.outline-none{--tw-outline-style:none;outline-style:none}
:focus-visible{outline:3px solid var(--signal-action)!important;outline-offset:3px!important}
```

The important outline shorthand sets its width, style, and color together, so it wins over the non-important `outline-style: none` emitted by `outline-none`. The important offset likewise remains three pixels. Therefore the existing `outline-none` search inputs receive the signal-action focus outline in the compiled CSS.

### Fix-round status and concerns

- Both Important findings are resolved.
- No commit was created.
- No new concern was introduced; only the previously documented non-fatal build warnings remain.
