# Replacing MobX State Tree with Zustand

Written 2026-09-08. A plan, not a change — nothing here has been done yet.

## Why this is worth doing

Three reasons, in order of how much they matter.

**The models duplicate the DTOs.** Every entity is declared twice: once as a class-validator DTO in
`packages/shared`, once as an MST model in each app. `apps/learning/src/stores/models/course.model.ts`
even carries a compile-time guard against the two drifting:

```ts
const _assertCourseWireShape: (dto: CourseDto) => ICourseSnapshotIn = (dto) => dto;
```

That guard exists because the duplication is real and dangerous. Three apps × the same entities means
a field added to `CourseDto` has to be added in up to four places. Typing the stores directly against
the shared contracts removes the second declaration entirely, and the guard with it.

**7,542 lines of store and model code** across the three apps, most of it MST ceremony — `t.optional`
appears 300 times, `.actions(` 114, `.views(` 104, and there are 149 hand-written setter methods
whose entire job is to assign one field.

**It removes a pending upgrade.** MobX 6 → 7, MST 6 → 8 and mobx-react-lite 4 → 5 are all waiting,
and the stores are the apps' spine. Migrating off is a better use of that work than doing it twice.

## The honest size of it

| | learning | teaching | admin | total |
| --- | --- | --- | --- | --- |
| stores | 12 | 11 | 5 | **28** |
| models | 31 | 25 | 11 | **67** |
| `observer()` wrappers | 58 files | 73 files | 14 files | **146 uses** |
| `useStores()` call sites | 40 files | 56 files | 5 files | **102 uses** |
| `flow(function*)` async actions | 30 | 22 | 6 | **58** |
| `getRoot` cross-store reads | 53 | 43 | 9 | **105** |
| files importing `mobx*` | — | — | — | **240** |

This is a large migration. It is not, however, a *deep* one, and that distinction is the whole reason
it is feasible.

## What makes it tractable

I checked for the MST features that have no clean Zustand equivalent. **None of them are used:**

- **No `t.reference` / `t.safeReference` anywhere.** The earlier count of 16 was a false positive —
  the pattern matched `get referenceStandards`. Relationships are already plain id strings
  (`standards: t.array(t.string)`), resolved through store views.
- **No `.volatile()`, no `addMiddleware`, no `onPatch`, no `onSnapshot`, no `resolveIdentifier`.**
- `t.frozen` appears 9 times, all for plain data blobs.
- `applySnapshot` appears 6 times, only in the SSR hydration path that never runs (see below).
- `destroy()` appears 22 times, only in root-store reset — a `delete` in Zustand.

So the stores are, in substance: **normalized maps of plain data, plus computed reads, plus async
fetches.** That is exactly Zustand's shape.

## Design decisions

These are the choices the migration commits to. They should be settled before any code moves.

### 1. Entity types come from `packages/shared`, not from models

```ts
// before: apps/*/src/stores/models/batch.model.ts — 40 lines
export const Batch = t.compose(BaseTimestampModel, BaseOrgOwnerModel, t.model('Batch', {
  _id: t.identifier, name: t.string, standard: t.string, year: t.number,
  isNew: t.optional(t.boolean, false),
})).actions((self) => ({ setName: (name: string) => { self.name = name }, /* ... */ }));

// after: no model file at all
import type { BatchDto } from '@repo/shared';

/** A batch in the store: the wire shape plus the fields only the UI needs. */
export interface Batch extends BatchDto {
  isNew?: boolean;
}
```

The client-only additions (`isNew`, `isLoading*`, `isLoaded*`) stay, declared as an extension of the
DTO so it is obvious which fields are ours. They are already stripped from every request by
`toPayload` in each app's `http.service.ts`, so nothing changes on the wire.

`BaseTimestampModel` / `BaseOrgOwnerModel` disappear: `BaseFields` in
`packages/shared/src/contracts/base.contract.ts` already carries `_id`, `_deleted`, `org`,
`createdBy`, `updatedBy`, `createdAt`, `updatedAt`, and `ResponseOf<T>` applies them.

**Settle this first.** `contracts/` already exports 19 types and covers almost everything the stores
model, but three are missing: **`InviteDto`, `RoleDto` and `UserDto`**. `UserDto` is the important
one — `user.store` is among the most connected stores in every app. Either extend `contracts/` to
cover those three, or type those stores against the validation DTO directly, which pulls
class-validator's *types* into the app: types only, so no runtime cost, but it crosses a boundary
the repo maintains on purpose. **Extend `contracts/` first** — it is three type aliases and it is
worth doing regardless of this migration. See `DATA_CONTRACTS.md`.

### 2. Every shape is declared, and shared shapes live in `packages/shared`

Two rules that hold for every line of this migration. Neither is new — they are the repo's existing
`must` tier — but a migration this mechanical is exactly where they get skipped.

**Declare the type.** `no-explicit-any` is an ESLint error in all six workspaces, and the point of
moving to DTO-typed stores is lost if the store leaks untyped shapes. Concretely:

- Each store gets a named, exported state interface. No inline `create<{...}>()` object literals.
- A patch action takes `Partial<T>`, not `Record<string, unknown>`: `patch(id, { name })` must fail
  to compile on a misspelled field. That is the whole reason for typing against the DTO.
- An async action's return type is written out (`Promise<void>`, `Promise<Batch | undefined>`), not
  inferred from a chain of awaits.
- No `as` to bridge a shape mismatch. If a store value does not fit the DTO, the store shape is
  wrong or a client-only field is undeclared — fix the declaration, do not cast. The one legitimate
  cast is at the wire boundary, and `callAuthApi<T>` already carries the type parameter for it.
- MST's `Instance<typeof X>` / `SnapshotIn` types disappear with the models. Anything that imported
  `IBatch` from `@stores` imports `Batch` from the store module or the contract instead — not a
  structural duplicate written by hand.

**If two modules need it, it goes in `packages/shared`.** The current stores violate this heavily,
and the migration is the moment to fix it rather than carry it across:

| Duplicated today | Where | Move to |
| --- | --- | --- |
| 10 model files byte-identical between learning and teaching (`batch`, `chapter`, `meet`, `option`, `org`, `plan`, `standard`, `subject`, `test-paper-section`) | `apps/*/src/stores/models/` | deleted — the DTO in `packages/shared` replaces them |
| `toast.model.ts`, identical in all **three** apps | `apps/*/src/stores/models/` | `IToast` in `packages/shared/src/interfaces/` |
| `batch.interface.ts`, byte-identical in learning and teaching | `apps/*/src/interfaces/` | `packages/shared/src/interfaces/` |
| `IBatchStat`, identical in learning and teaching | declared inside `batch.store.ts` | `packages/shared/src/interfaces/` |
| `IMaterialStat`, in learning and teaching | declared inside `material.store.ts` | `packages/shared/src/interfaces/` — **but reconcile first**: teaching's version has an extra `durationMins?`. Declare the superset with that field optional, which is what teaching already does. |

Seventeen model file names appear in two or more apps. Most vanish into their DTO; what remains is
the genuinely client-side part, and that is the part to place deliberately:

- **Pure data, needed by more than one app** → `packages/shared/src/interfaces/`. No React imports
  there, ever — it compiles to CommonJS for the server.
- **Needs React** (a `ReactNode` label, a component prop) → `packages/ui/src/types/`.
- **One app only, and not sent anywhere** → that app's `src/interfaces/`.

`define-data-shape` is the decision procedure; follow it rather than re-deriving it per store. And
when a shape moves into `packages/shared`, `pnpm build:shared` runs before any consumer typechecks —
otherwise the errors you are reading are stale.

### 3. One store per domain, keyed maps, selectors for reads

```ts
interface BatchState {
  batches: Record<string, Batch>;          // was t.map(Batch)
  isLoading: boolean;
  isLoaded: boolean;
  load: () => Promise<void>;               // was flow(function* ...)
  upsert: (batch: Batch) => void;
  patch: (id: string, fields: Partial<Batch>) => void;   // replaces 149 setters
  remove: (id: string) => void;
}

export const useBatchStore = create<BatchState>()((set, get) => ({ /* ... */ }));
```

The 149 instance setters (`batch.setName(x)`) collapse into one `patch(id, { name: x })` per store.
Instance methods have no equivalent in Zustand and should not be recreated.

### 4. Computed views become selectors, and this is the re-render trap

MobX tracks property access automatically; `observer` re-renders exactly when something read
changes. Zustand re-renders when the *selector result* changes by reference. A view returning a new
array — and `get batches() { return Array.from(self.batchMaps.values()) }` is exactly that, used
throughout — will re-render on every store change unless it is handled.

```ts
// wrong: new array every call, re-renders on any state change
const batches = useBatchStore((s) => Object.values(s.batches));

// right
import { useShallow } from 'zustand/react/shallow';
const batches = useBatchStore(useShallow((s) => Object.values(s.batches)));
```

**This is the single most likely source of regressions**, because it is invisible: the app still
works, it just re-renders more. Every converted view needs `useShallow` or a memoised selector.

### 5. Cross-store access replaces `getRoot` (105 sites)

MST's `getRoot<IStore>(self)` gives any node the whole tree. Zustand stores are independent, and
this is the one place the migration is genuinely more verbose. Two mechanisms, chosen per case:

- **Inside an action:** import the other store and call `useOtherStore.getState()`. No hook, works
  outside React, no provider.
- **Inside a component:** subscribe to both stores separately. Two hooks, not one.

Circular imports are the hazard — `user.store` and `selector.store` reach for each other today. Where
that happens, either move the shared derivation into a plain helper both import, or read through
`getState()` lazily inside the action body rather than at module scope.

### 6. No provider, no `useStores`, no SSR store

`useStores()` / `initializeStore()` / `IRootStoreSnapshot` all go away. Zustand stores are module
singletons, which also means **`toastStore.addToast()` from `utils/helpers/toasts.ts` keeps
working** — that non-React access is native (`useToastStore.getState().add(...)`), where MST needed a
manually created singleton.

The SSR hydration branch in `initializeStore` (`applySnapshot` when a snapshot is passed) is dead
code: all 102 call sites are the bare `useStores()` — the only three matches taking an argument are
the function definitions themselves — and no page uses `getServerSideProps` or `getStaticProps`.
It should be deleted, not ported.

### 7. `observer` comes off, in the same commit as the store it depends on

146 `observer()` wrappers. A component reading a migrated store must lose its `observer`; a component
still reading an MST store must keep it. **Both libraries will be installed during the migration** —
that is intended, not a smell, and it is what makes an incremental path possible.

## Sequencing

The rule: **the app builds and runs at the end of every step.** One store per commit, one app at a
time, smallest app first.

**Phase 0 — groundwork (no behaviour change)**
1. Add `InviteDto`, `RoleDto` and `UserDto` to `packages/shared/src/contracts/`, then
   `pnpm build:shared`. Everything else the stores model is already covered.
2. Move the shapes from the table in decision 2 into `packages/shared/src/interfaces/` — `IToast`,
   `batch.interface.ts`, `IBatchStat`, and the reconciled `IMaterialStat`. This is a pure
   type move with no behaviour change, so it can land before any store is touched and be verified by
   typecheck alone.
3. Add `zustand` (5.0.15, peers `react >=18`) to the three apps.
4. Write one reference store end to end — **`toast` in admin**: 5 stores, 14 `observer` uses, 9
   `getRoot`, and the toast store is self-contained with an existing non-React caller. It sets the
   pattern everything else copies.

**Phase 1 — admin (the rehearsal, 5 stores)**
`toast` → `standard` → `course` → `selector` → delete `root.store.ts`. Admin is small enough that
a mistake is cheap and visible, and it exercises every mechanism: keyed maps, async load,
cross-store reads, and non-React access.

**Phase 2 — teaching (11 stores)**
Leaf stores first (`toast`, `batch`, `standard`, `material`), then the ones others read
(`user`, `course`, `question`, `test-paper`, `meet`), then `selector` (293 lines, the most connected),
then delete the root store.

**Phase 3 — learning (12 stores)**
Same order. `resource` and `test-paper` carry the exam flow, which is the most stateful part of the
codebase and should be last.

**Phase 4 — removal**
Drop `mobx`, `mobx-react-lite`, `mobx-state-tree` from all three manifests. Delete
`src/stores/models/`. Confirm `grep -rn "from 'mobx" apps/*/src` returns nothing.

**Phase 5 — documentation**
`add-app-screen`, `define-data-shape` and `CLAUDE.md` all describe MST as the state layer. They must
be rewritten in the same batch, not later.

## Verification, and why this needs a human

The repo has **no test suite**. Typecheck and lint will catch the shape of the migration; they will
not catch a re-render regression, a stale selector, or a screen that silently stops updating.

Per store commit, alongside the ladder:

- **no new `any`, no new `as`** — `git diff | grep -nE ': any|as [A-Z]'` on the diff, and
  `pnpm lint` must stay at 0 errors.
- **nothing app-local that two apps need** — if the same shape appears in the second app's
  conversion, stop and move it to `packages/shared` in that commit rather than copying it.

Then:

```bash
env -u _VOLTA_TOOL_RECURSION volta run --node 24.20.0 -- pnpm exec tsc --noEmit   # in the app
pnpm lint                                                                         # 0 errors
pnpm build:<app>
```

Then, and this is the part that cannot be skipped: **open the screens that store drives** and check
they still load, update and reset. For each converted store, note in the commit which screens were
exercised. A migration this size with no tests is carried by that discipline alone.

`grep -c "observer(" ` per app is a useful progress signal: it should fall to zero.

## What could go wrong

| Risk | Mitigation |
| --- | --- |
| Re-render regressions from array/object selectors | `useShallow` on every collection selector; review each converted view |
| Circular imports between stores | Read peers via `getState()` inside action bodies, never at module scope |
| A screen stops updating and nobody notices | Manual pass per store, recorded in the commit message |
| Half-migrated state drags on | One store per commit; both libraries installed until Phase 4 |
| Contracts missing for some entities | Phase 0 blocks on extending `contracts/` |

## What this does not change

The HTTP layer, `toPayload`, the DTOs, the server, and the client-only key list. Requests keep the
same shape, because the store shape was never what the API saw.

## Estimate

Phase 0 is half a day. Admin is a day. Teaching and learning are two to three days each, dominated by
the manual screen passes rather than the code. Call it **a week of focused work**, and it is the kind
of work that goes badly if rushed across three apps at once — which is why the sequencing above never
has more than one store in flight.
