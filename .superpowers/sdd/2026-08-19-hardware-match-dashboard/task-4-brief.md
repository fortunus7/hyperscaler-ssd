### Task 4: Repair primary dashboard affordance and accessibility

**Files:**
- Modify: `client/src/pages/Home.tsx`
- Modify: `client/src/index.css`
- Modify: `client/index.html`

**Interfaces:**
- Preserves: current profile filtering, 3-way comparison, workbench components, source register
- Changes: accessible toggles/menu, compact visual overview, single mobile navigation, empty states

- [ ] **Step 1: Remove broken image dependencies**

Remove all `/manus-storage/*` references from `Home.tsx`; replace the hero/card imagery with CSS gradients/patterns already supported by Tailwind/CSS.

- [ ] **Step 2: Make profile interactions explicit**

Use a real button for the entire profile detail action; keep the compare toggle separate and add `aria-pressed`. When 3 profiles are selected, prevent silent eviction and expose the reason in the button label/title.

- [ ] **Step 3: Complete filter and menu semantics**

Add `aria-pressed` to region/metric controls and `aria-expanded`/`aria-controls` to the mobile menu. Add visible result count and a 0-result reset state.

- [ ] **Step 4: Simplify mobile navigation and zoom**

Remove the fixed bottom dock, retain the sticky top menu, and remove `maximum-scale=1` from `client/index.html`.

- [ ] **Step 5: Raise contrast and focus visibility**

Add semantic `--signal-action: #c94a24`; add a global `focus-visible` ring and use the darker signal for small action text in the new matcher.

- [ ] **Step 6: Run typecheck and build**

Run: `pnpm check && pnpm build`

Expected: both commands exit 0.

