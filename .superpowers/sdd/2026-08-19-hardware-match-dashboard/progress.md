# SDD ledger — plan: docs/superpowers/plans/2026-08-19-hardware-match-dashboard.md

## Preflight

Baseline: `corepack pnpm test` — 8 files, 14 tests passed on 2026-08-19.

| Task | Shares / interface | Finding |
|---|---|---|
| 1 | Produces catalog types and arrays consumed by Tasks 2–3 | Internally consistent; exact 16/14 counts match the research snapshot. |
| 2 | Consumes Task 1 types; produces matcher result consumed by Task 3 | Internally consistent; spec forbids aggregate percentage and plan does not request one. |
| 3 | Extends Task 2 formatter and modifies `Home.tsx`, also modified in Task 4 | Sequence is load-bearing: Task 3 integrates first, Task 4 repairs the same page afterward. No parallel implementation. |
| 4 | Shares `Home.tsx` with Task 3 and CSS/HTML with final visual check | Internally consistent; preserves all existing workbench contracts. |
| 5 | Consumes all prior outputs and performs no product-code ownership | Internally consistent; verification is fresh and complete. |

Ruling: The folder is not a Git repository, so worktree creation, task commits, and git-based review packages are unavailable. Continue in the user-provided workspace, use strict per-task file ownership, focused tests, and independent file-based reviews. Cost if wrong: task-level rollback and diff provenance are weaker than Git history, so final verification and review must inspect every changed file directly.

Ruling: The user explicitly requested autonomous completion in the provided AGENTS.md, so the already-stated recommended design is treated as the implementation approval gate. Cost if wrong: the selected top-of-page matcher layout may need UI rework, but all changes are local and reversible.

Task 1 review: Important — three server maximum-bay/form-factor records are inaccurate; two Supermicro URLs are generic; the new client test is excluded by the root Vitest include.

Task 1: Ruling: Expand Task 1 ownership to `vitest.config.ts` so the plan's required focused command and normal suite can execute the catalog test. This follows the spec's test requirement although the original file list omitted the configuration surface. Cost if wrong: client tests may expose unrelated failures in future suites, which is the intended CI behavior but increases test scope.

Task 1: minor (deferred): preserve the measurement basis for mixed `activePowerW` values.
Task 1: minor (deferred): rename two 1.6TB SSD IDs that currently end in `1tb`.
Task 1: minor (deferred): strengthen catalog integrity assertions for unique IDs, scope separation, domains, and derived stats.

Task 1: fix round 1/5 (5 addressed, 0 open — server maxima, exact sources, client test discovery; no commits because Git unavailable).
Task 1: complete (review clean; focused 2/2, full suite 16/16, typecheck clean).

Task 2: minor (deferred): add verdict-precedence tests combining form-factor mismatch with bottleneck/unknown PCIe states.
Task 2: minor (deferred): split null-operand tests for capacity, power, and SSD-side PCIe metadata.
Task 2: complete (review approved; focused 6/6, full suite 22/22, typecheck clean).

Task 3 review: Important — active selections can disappear behind filters; capacity precision bypasses the formatter; the live region announces too much; mobile users can change SSDs below an off-screen verdict.
Task 3: minor (deferred): explain A/B/C source-confidence grades in the UI.

Task 3: fix round 1/5 (4 addressed, 0 open — visible selection, capacity precision, concise live region, mobile sticky verdict; no commits because Git unavailable).
Task 3: complete (review clean; focused 8/8, full suite 24/24, typecheck and build passed).

Task 4 review: Important — section numbering still repeats inside preserved workbenches; Tailwind `outline-none` suppresses the intended global focus ring.
Task 4: Ruling: Expand Task 4 ownership to `ServerWorkbench.tsx` and `CandidateWorkbench.tsx` only for visible section-label numbering. Cost if wrong: future copy changes must keep more components synchronized, but the visible flow becomes coherent now.
Task 4: minor (deferred): profile detail activation updates distant content without scrolling/focusing the detail section.
Task 4: minor (deferred): sticky mobile hash targets need scroll offset handling.

Task 4: fix round 1/5 (2 addressed, 0 open — coherent 01–08 flow and durable focus ring; no commits because Git unavailable).
Task 4: complete (review clean; focused 3/3, full suite 27/27, typecheck and build passed).

Task 5 verification: automated checks passed, but acceptance remained partial because the matcher did not display `catalogStats.updatedAt`, the specified `상세 근거 보기` entry point was absent, and browser/layout checks were reserved for the root agent.
Task 5: fix round 1/5 (2 addressed, 0 open — catalog snapshot date and working `#profiles` evidence link; one date-format regression test added).
Task 5: browser smoke passed at 390px (document/body scroll width 390px; only the intentionally scrollable 850px comparison table exceeds the viewport). Clicking HPE ProLiant DL380 Gen11 and Micron 9550 PRO E3.S 15.36TB updated `aria-pressed`, the live verdict, raw capacity to 553.0 TB, and active power to 648 W.
Task 5: complete (12 files / 28 tests passed, TypeScript check passed, production build passed with 1,720 modules transformed; catalog date/link confirmed in the live DOM).

Final review: Important — the matcher flattened multi-configuration bay counts and mixed physical envelope with connector names, causing R660 2.5-inch/U.2 capacity to inherit the 16-bay E3.S maximum. Important — `프로파일 보기` changed distant content without revealing or focusing it.
Final review: fix round 1/5 complete — introduced per-configuration storage options, separate SSD envelope/interfaces, conservative unknown connector review, selected-option capacity/power, R660 official 10×2.5-inch/U.2 and 16×E3.S regressions, profile detail focus/scroll with reduced-motion handling, and all requested minor fixes within ownership.
Final review: focused 19/19, full suite 12 files / 36 tests, TypeScript check, Vite client build, and esbuild server bundle passed. Existing non-fatal analytics placeholder and chunk-size warnings remain. Server/Candidate workbench hash offsets are documented as a non-blocking ownership-limited follow-up.
Final review: scoped re-review APPROVE — both Important and all seven requested Minor findings resolved without detected regressions. Remaining non-blocking minor: `#servers` and `#candidates` component-owned hash targets do not yet have `scroll-mt-16`.
Final browser smoke: PASS at 1440px and 390px. At 390px, document/body width remained 390px; R660 + Samsung PM1743 2.5-inch/U.2 selected the 10-bay option and announced 153.6 TB; profile activation moved focus to `#profile-detail` and scrolled from 0 to 7267px. Final screenshots and JSON evidence are under `artifacts/visual-smoke/`.
