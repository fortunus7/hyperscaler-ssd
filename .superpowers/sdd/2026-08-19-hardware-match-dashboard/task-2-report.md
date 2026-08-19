# Task 2 Report: Hardware compatibility engine

## Status

Complete. The pure hardware matcher and focused regression tests are implemented within the assigned ownership boundary. No Git commit was created because this workspace has no Git metadata available for the task.

## Files

- `shared/hardwareMatch.ts`
  - Exports `analyzeHardwareMatch(server, ssd): HardwareMatchResult`.
  - Uses exact form-factor membership as the physical compatibility gate.
  - Classifies PCIe as `native`, `backward-compatible`, `host-bottleneck`, or `unknown`.
  - Multiplies raw capacity and estimated drive power only when every required public value is disclosed; otherwise returns `null`.
  - Reports workload-tag intersection and SSD endurance class as explanatory text only.
  - Returns five accessible check rows with an icon, status code, status label, label, and evidence sentence.
  - Does not expose or compute an aggregate percentage score.
- `shared/hardwareMatch.test.ts`
  - Covers blocking form-factor mismatch and its failed check row.
  - Covers all four PCIe states.
  - Covers capacity/power totals and null propagation for either undisclosed operand.
  - Covers workload intersection, endurance explanation, no-score behavior, and verdict precedence.
- `.superpowers/sdd/2026-08-19-hardware-match-dashboard/task-2-report.md`
  - Records the TDD and verification evidence for this task.

## TDD evidence

### Initial RED

Command:

```text
& '.\node_modules\.bin\vitest.cmd' run shared/hardwareMatch.test.ts
```

Observed result: exit code 1. Vitest failed to load `./hardwareMatch` because the production module did not exist. This was the expected feature-missing failure before implementation.

The exact requested command was also attempted:

```text
corepack pnpm exec vitest run shared/hardwareMatch.test.ts
```

In this Windows workspace it exits before test collection with `'vitest' is not recognized as an internal or external command`, despite `node_modules/.bin/vitest.cmd` and the installed package being present. The direct local binary was therefore used for focused RED/GREEN evidence without installing or changing dependencies.

### Contract-alignment RED

After implementing the first minimal matcher, the binding spec's `formFactor` result name was locked with a test before changing production code.

Observed result: exit code 1, 1 failed / 5 passed. The failure was `expected undefined to be false` at the `result.formFactor` assertion. Production code was then changed from the internal result name to the binding contract name.

### Final focused GREEN

Command:

```text
& '.\node_modules\.bin\vitest.cmd' run shared/hardwareMatch.test.ts
```

Observed result: exit code 0; 1 test file passed; 6 tests passed.

## Full verification

- `corepack pnpm test` → exit code 0; 10 test files passed; 22 tests passed.
- `corepack pnpm check` → exit code 0; `tsc --noEmit` reported no TypeScript errors.
- No packages were installed and no lockfile or package-manager configuration was changed.

## Self-review

- Confirmed form-factor mismatch always wins over other signals and produces `incompatible`.
- Confirmed a faster SSD on an older host and undisclosed PCIe metadata produce `review`, while native and backward-compatible links remain `compatible` when the form factor matches.
- Confirmed capacity and power never infer missing values and also return `null` when bay count is undisclosed.
- Confirmed workload overlap and endurance affect explanation/check presentation, not the compatibility verdict or a synthetic score.
- Confirmed the check-row contract provides non-color cues (`icon`, `statusLabel`) plus an evidence sentence (`detail`).
- Mutation review: reversing either PCIe comparison, accepting a non-exact form factor, substituting zero for missing values, omitting workload intersection, or adding a `score` property would fail at least one focused test.

## Concerns

- The requested `corepack pnpm exec vitest ...` focused invocation is not usable in the current Windows dependency shim state. The repository's standard `corepack pnpm test` script resolves Vitest correctly and the direct checked-in local shim supplies equivalent focused execution evidence. No dependency repair was attempted because installation and package-manager changes were explicitly out of scope.
