# Task 1 Report — Official hardware catalog contracts and records

## Status

Implemented the typed official hardware catalog with exactly 16 server product-family records and 14 SSD product-family/SKU records. The catalog exposes `ServerCatalogItem`, `SsdCatalogItem`, `serverCatalog`, `ssdCatalog`, and derived `catalogStats`.

No commit (not a git repository).

## RED

Test added first in `client/src/data/hardwareCatalog.test.ts` using the task brief verbatim.

Required command attempted:

```text
pnpm exec vitest run client/src/data/hardwareCatalog.test.ts
```

The repository wrapper stopped before Vitest with `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`. After dependencies were made available, the repository Vitest config still excluded `client/**/*.test.ts`, so the focused test was run against the existing Vite config:

```text
node_modules/.bin/vitest.cmd -c vite.config.ts run src/data/hardwareCatalog.test.ts

FAIL  src/data/hardwareCatalog.test.ts
Error: Failed to load url ./hardwareCatalog ... Does the file exist?
Test Files  1 failed (1)
```

This was the expected RED: the production module did not exist.

## GREEN

Focused catalog test after implementation:

```text
node_modules/.bin/vitest.cmd -c vite.config.ts run src/data/hardwareCatalog.test.ts

✓ src/data/hardwareCatalog.test.ts (1 test)
Test Files  1 passed (1)
Tests       1 passed (1)
```

Configured repository suite:

```text
node_modules/.bin/vitest.cmd run

Test Files  8 passed (8)
Tests       14 passed (14)
```

TypeScript validation:

```text
node_modules/.bin/tsc.cmd --noEmit
exit code 0, no diagnostics
```

Formatting check initially identified the new catalog file; `prettier --write` was applied to the two owned source files.

Final commands requested by the workspace lead were also attempted:

```text
corepack pnpm exec vitest run client/src/data/hardwareCatalog.test.ts
ERROR packages field missing or empty

corepack pnpm test
ERROR packages field missing or empty
```

These commands are blocked by the pre-existing `pnpm-workspace.yaml` shape. The successful focused and full-suite evidence above used the installed binaries directly. The repository's `vitest.config.ts` currently includes only `server/**` and `shared/**`, so the catalog test needs the Vite-config override until the parent integration task updates test discovery.

## Files changed

- `client/src/data/hardwareCatalog.test.ts` — catalog count, vendor coverage, and provenance integrity test.
- `client/src/data/hardwareCatalog.ts` — source/provenance literals, normalized form-factor and workload types, 16 server records, 14 SSD records, and derived stats.
- `.superpowers/sdd/2026-08-19-hardware-match-dashboard/task-1-report.md` — this report.

## Self-review

- Server count is exactly 16 across Dell Technologies, HPE, Lenovo, Supermicro, and NVIDIA (5 vendors).
- SSD count is exactly 14 across Samsung, Solidigm, KIOXIA, Micron, SanDisk, SK hynix, and DapuStor (7 vendors).
- Every record has an HTTPS vendor-domain source URL, retrieval date `2026-08-19`, A/B/C confidence, and an allowed Korean value-scope literal.
- Server value scope is always `제품군 공개 최대값`; SSD scope is `제품군 대표 최대값` or `명시 SKU 값`.
- Unestablished SKU-dependent performance and capacity fields are represented as `null`; no runtime dependency or backend contract was added.
- IDs are stable kebab-case values and the arrays conform to their exported interfaces under TypeScript 5.9.

## Concerns

- Package-manager bootstrap changed unowned package-manager artifacts while trying to satisfy the required pnpm command. The workspace lead was notified and is restoring those artifacts; no further changes were made to them by this task.
- Client-side tests are not included by the current root Vitest configuration. The focused test passes with `-c vite.config.ts`, but `pnpm test` will not discover it until test include patterns are updated by an owner of that configuration.
- Catalog values are a dated static research snapshot, not live availability or a shipping BOM; source pages must be rechecked when vendors revise product families.

---

## Fix round 1/5 — model-specific bay limits and client test discovery

### Findings fixed

- Corrected Dell PowerEdge R660 from 10 to 16 NVMe bays; retained the model-supported `2.5-inch` and `E3.S` form factors.
- Corrected SuperServer SYS-121H-TNR from 8 to 12 NVMe bays, removed unsupported `E3.S`, and replaced the generic family URL with `https://www.supermicro.com/en/products/system/hyper/1u/sys-121h-tnr`.
- Corrected SuperServer SYS-221H-TNR from 24 to 16 NVMe bays, removed unsupported `E3.S`, and replaced the generic family URL with `https://www.supermicro.com/en/products/system/datasheet/SYS-221H-TNR`.
- Added model-specific regression assertions for all three corrected records.
- Expanded `vitest.config.ts` test discovery to include `client/**/*.test.ts` and `client/**/*.spec.ts` while preserving the server/shared patterns.

### RED evidence

Before the catalog corrections, the new regression test failed on the first bad record:

```text
node_modules/.bin/vitest.cmd -c vite.config.ts run src/data/hardwareCatalog.test.ts

FAIL official hardware catalog > keeps model-specific NVMe bay limits, form factors, and sources
Expected nvmeBays: 16
Received nvmeBays: 10
Test Files  1 failed (1)
Tests       1 failed | 1 passed (2)
```

### Required verification

Corepack did not inherit the existing `node_modules/.bin` entry in this shell, so each required command was run unchanged after prepending that already-installed directory to the process-local `PATH`. No install command ran and no package-manager artifact was modified.

```text
corepack pnpm exec vitest run client/src/data/hardwareCatalog.test.ts

Test Files  1 passed (1)
Tests       2 passed (2)
```

```text
corepack pnpm test

Test Files  9 passed (9)
Tests       16 passed (16)
```

```text
corepack pnpm check

> tsc --noEmit
exit code 0, no diagnostics
```

### Fix-round self-review and concerns

- The normal root suite now discovers the client catalog test, proven by its appearance in the 9-file full-suite output.
- The regression test checks actual exported catalog records rather than source text and would fail on a wrong bay count, reintroduced E3.S support, or regression to a generic Supermicro URL.
- No commit was created because this directory is not a Git repository.
- Remaining concern: this shell requires a process-local `PATH` prepend for `corepack pnpm exec` to resolve already-installed project binaries; this does not affect catalog behavior or test discovery.
