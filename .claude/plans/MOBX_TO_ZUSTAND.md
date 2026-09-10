# Replacing MobX State Tree with Zustand

Written 2026-09-08. **Done, 2026-09-09.** MobX is gone from the monorepo: no app declares `mobx`,
`mobx-react-lite`, `mobx-state-tree` or `mobx-devtools-mst`, there are zero `observer()` wrappers,
and `pnpm-lock.yaml` no longer mentions any of them. 28 MST stores and 67 model files became 24
Zustand stores.

This file is kept as the record of *how*, and every decision below still governs new code — the
`add-app-screen` and `define-data-shape` skills point back here. Decisions 8 and 9, the notes under
each phase, and the two traps in decision 4 were written against real code during the migration
rather than ahead of it, which is why they are worth reading before touching a store.

What the migration turned up along the way, all pre-existing, is recorded in the commit messages:
six client/server mismatches (three separate instances of reading fields an endpoint never sends —
one of which blanked the whole learning app, one of which left every teaching page on a spinner),
two calls to routes that do not exist, a `timezoneOffset` sent as a number against a String column,
and a `PARTIALLY_CORRECT` exam branch that is unreachable. Two gaps still need a server change: a
LEARN-accessible route for a learner's standards, and `test-paper/sections-with-questions`.

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

|                                 | learning | teaching | admin    | total        |
| ------------------------------- | -------- | -------- | -------- | ------------ |
| stores                          | 12       | 11       | 5        | **28**       |
| models                          | 31       | 25       | 11       | **67**       |
| `observer()` wrappers           | 58 files | 73 files | 14 files | **146 uses** |
| `useStores()` call sites        | 40 files | 56 files | 5 files  | **102 uses** |
| `flow(function*)` async actions | 30       | 22       | 6        | **58**       |
| `getRoot` cross-store reads     | 53       | 43       | 9        | **105**      |
| files importing `mobx*`         | —        | —        | —        | **240**      |

This is a large migration. It is not, however, a _deep_ one, and that distinction is the whole reason
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
export const Batch = t
  .compose(
    BaseTimestampModel,
    BaseOrgOwnerModel,
    t.model('Batch', {
      _id: t.identifier,
      name: t.string,
      standard: t.string,
      year: t.number,
      isNew: t.optional(t.boolean, false),
    }),
  )
  .actions((self) => ({
    setName: (name: string) => {
      self.name = name;
    } /* ... */,
  }));

// after: no model file at all
import type { BatchDto } from '@repo/shared';

/** A batch in the store: the wire shape plus the fields only the UI needs. */
export interface Batch extends BatchDto {
  isNew?: boolean;
}
```

The client-only additions stay, declared as an extension of the DTO so it is obvious which fields
are ours — in practice through `ClientEntity<T>`, which decision 9 covers. They are already stripped
from every request by `toPayload` in each app's `http.service.ts`, so nothing changes on the wire.
The per-fetch `isLoading*` / `isLoaded*` fields do **not** come across at all; they are replaced
wholesale by decision 8.

`BaseTimestampModel` / `BaseOrgOwnerModel` disappear: `BaseFields` in
`packages/shared/src/contracts/base.contract.ts` already carries `_id`, `_deleted`, `org`,
`createdBy`, `updatedBy`, `createdAt`, `updatedAt`, and `ResponseOf<T>` applies them.

**Settle this first.** `contracts/` already exports 19 types and covers almost everything the stores
model, but three are missing: **`InviteDto`, `RoleDto` and `UserDto`**. `UserDto` is the important
one — `user.store` is among the most connected stores in every app. Either extend `contracts/` to
cover those three, or type those stores against the validation DTO directly, which pulls
class-validator's _types_ into the app: types only, so no runtime cost, but it crosses a boundary
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

| Duplicated today                                                                                                                                               | Where                               | Move to                                                                                                                                                                                           |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 10 model files byte-identical between learning and teaching (`batch`, `chapter`, `meet`, `option`, `org`, `plan`, `standard`, `subject`, `test-paper-section`) | `apps/*/src/stores/models/`         | deleted — the DTO in `packages/shared` replaces them                                                                                                                                              |
| `toast.model.ts`, identical in all **three** apps                                                                                                              | `apps/*/src/stores/models/`         | `IToast` in `packages/shared/src/interfaces/`                                                                                                                                                     |
| `batch.interface.ts`, byte-identical in learning and teaching                                                                                                  | `apps/*/src/interfaces/`            | `packages/shared/src/interfaces/`                                                                                                                                                                 |
| `IBatchStat`, identical in learning and teaching                                                                                                               | declared inside `batch.store.ts`    | `packages/shared/src/interfaces/`                                                                                                                                                                 |
| `IMaterialStat`, in learning and teaching                                                                                                                      | declared inside `material.store.ts` | `packages/shared/src/interfaces/` — **but reconcile first**: teaching's version has an extra `durationMins?`. Declare the superset with that field optional, which is what teaching already does. |

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
interface BatchState extends IRequestSlice<'batches'> {
  batches: Record<string, Batch>; // was t.map(Batch)
  load: () => Promise<void>; // was flow(function* ...)
  upsert: (batch: Batch) => void;
  patch: (id: string, fields: Partial<Batch>) => void; // replaces 149 setters
  remove: (id: string) => void;
}

export const useBatchStore = create<BatchState>()((set, get) => ({/* ... */}));
```

The fetch flags are not fields here: `IRequestSlice` supplies them, and decision 8 says why.

The 149 instance setters (`batch.setName(x)`) collapse into one `patch(id, { name: x })` per store.
Instance methods have no equivalent in Zustand and should not be recreated.

**Derivations belong in the store, not in the selector.** A `useShallow` selector is the right place
to say _how to compare_, never the place to hold domain logic. Anything with more than one step — a
lookup chained into a `map`, a `reduce`, a `filter` that encodes a rule — becomes a named method:

| Was inline in a component                                               | Now on the store                |
| ----------------------------------------------------------------------- | ------------------------------- |
| a `reduce` building subject names per standard                          | `getSubjectNamesByStandard()`   |
| `getStandardsByIds(ids).map((s) => s.name).join(', ')`, in **6 places** | `getStandardNamesText(ids)`     |
| the same for subjects                                                   | `getSubjectNamesText(ids)`      |
| `subjects.map((s) => ({ label, value }))`                               | `getSubjectItems()`             |
| `standards.filter((s) => s._id !== id).map(...)`                        | `getStandardItemsExcluding(id)` |
| `getStandardsByIds(ids).map(getStandardSelectItem)`                     | `getStandardItemsByIds(ids)`    |
| `getStandardSubjectChapters(a, b).map((c) => ({ label, value }))`       | `getChapterItems(a, b)`         |

The component keeps only the comparison:

```tsx
const subjectNamesByStandard = useStandardStore(useShallow((state) => state.getSubjectNamesByStandard()));
```

Three things this buys beyond shorter components: the logic is testable without a renderer (these
were verified against both real stores before adoption); a repeated derivation has one definition
rather than six that can drift; and it removes the temptation to select a lookup function and chain
off it in JSX, which is the stale-render trap in decision 4. `getStandardSelectItem` in teaching's
`utils/helpers` became dead when `getStandardItemsByIds` landed, and was deleted — expect more of
that as stores absorb their derivations.

### 4. Computed views become selectors, and this is the re-render trap

MobX tracks property access automatically; `observer` re-renders exactly when something read
changes. Zustand re-renders when the _selector result_ changes by reference. A view returning a new
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

**The inverse trap is worse, and it bit this migration.** A store lookup (`getStandardById`,
`getSubjectsByIds` — teaching's standard store alone exposes twelve) is a _stable_ function
reference. Selecting it and calling it during render therefore compiles, reads correct data, and
**never re-renders**, because the selector result never changes:

```ts
// wrong: the column silently goes stale when a mapping changes
const getSubjectsByIds = useStandardStore((s) => s.getSubjectsByIds);
valueFormatter: (row) => getSubjectsByIds(getStandardSubjectIds(row._id)).map(...).join(', ');

// right: derive in the selector, so the shallow compare sees the change
const subjectNamesByStandard = useStandardStore(
  useShallow((s) =>
    s.getStandards().reduce<Record<string, string>>((names, standard) => { ... }, {}),
  ),
);
valueFormatter: (row) => subjectNamesByStandard[row._id] ?? '';
```

Where a re-render is not wanted at all — an event handler, a save path — call through
`useStandardStore.getState()` instead of a hook. That says "read once, now" explicitly.

The rule: **a hook selects data; `getState()` calls behaviour.** Selecting a function is only right
when the component passes it to a child as a callback, never when it calls it to render.

### 5. Cross-store access replaces `getRoot` (105 sites)

MST's `getRoot<IStore>(self)` gives any node the whole tree. Zustand stores are independent, and
this is the one place the migration is genuinely more verbose. Two mechanisms, chosen per case:

- **Inside an action:** import the other store and call `useOtherStore.getState()`. No hook, works
  outside React, no provider.
- **Inside a component:** subscribe to both stores separately. Two hooks, not one.

Circular imports are the hazard — `user.store` and `selector.store` reach for each other today. Where
that happens, either move the shared derivation into a plain helper both import, or read through
`getState()` lazily inside the action body rather than at module scope.

**Better still, check whether the edge is needed at all.** Admin's two edges both disappeared on
contact: the read edge became a composed hook subscribing to each store separately, and the write
edge moved to the component by having the create action return the new id. That leaves no cycle to
be careful about, and it is what the ordering constraint below is really asking for. Try to delete
an edge before porting it.

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

### 8. Request state is one status field, and no store hand-assigns it

The stores track a fetch with a pair of booleans per fetch, and the sprawl is the argument for
replacing it rather than porting it: **20 `isLoading*` declarations, 17 `isLoaded*`, 148 assignments
in stores and 357 reads in components.** Two booleans have four states and only three are
meaningful, and the impossible fourth is where the bugs live — the same typo exists in all three
apps, where `standard.store.ts` ends two loaders with `isLoadingX = true` in place of
`isLoadedX = true` (six sites).

So: one status field, in `packages/shared` because all three apps need it.

```ts
export type RequestStatus = 'idle' | 'loading' | 'loaded' | 'error';

export interface IRequestState {
  status: RequestStatus;
  error?: string; // set only when status is 'error'
}
```

A store declares its fetches by name and spreads in the slice, which supplies `requests`,
`isLoading`, `isLoaded`, `isFailed`, `shouldLoad`, `getError`, `run`, `setRequest` and
`resetRequests`:

```ts
type StandardFetch = 'standards' | 'subjects' | 'mappings';

export interface IStandardState extends IRequestSlice<StandardFetch> {
  standardMap: Record<string, IStandard>;
  loadStandards: () => Promise<void>;
}

export const useStandardStore = create<IStandardState>()((set, get) => ({
  standardMap: {},
  ...createRequestSlice(['standards', 'subjects', 'mappings'], set, get),
  loadStandards: () =>
    get().run('standards', async () => {
      const result = await StandardService.getStandards();
      if (result?.data) get().addStandards(result.data);
    }),
}));
```

Four rules come with it:

- **`run` is the only writer.** No store assigns a status, which is what makes the typo class
  unwritable. There is deliberately no standalone `runRequest` helper — one way to do it.
- **The fetch names are a union**, so `isLoading('subjets')` is a compile error rather than a lookup
  returning `undefined` that reads as "not loading".
- **The guard is opt-in at the call site.** `if (shouldLoad('standards')) loadStandards()` on mount
  fetches once; a bare `loadStandards()` always refetches, which is what a post-save refresh needs.
  It also **retries after a failure**, which the boolean pair never did — a failed load used to
  leave `isLoading` true and the guard blocked forever.
- **Getters must return primitives.** `isLoading(key)` returns a boolean, so the selector result is
  `Object.is`-stable. There is no `getRequest(key)` returning the object, because that is a fresh
  reference per call and therefore a re-render loop; select the leaf (`s.requests.standards`)
  instead, which keeps its reference when a sibling fetch changes.

Component-side there are two hooks in `@repo/ui/hooks`, so a screen never writes the guard by hand:

```tsx
// loads once on mount, and reports the status — replaces a useEffect + shouldLoad guard +
// two selections
const { isLoading, isFailed, error } = useLoadOnce(useStandardStore, 'standards', (s) => s.loadStandards);

// just the status, where the load is triggered elsewhere (an auth gate, a parent)
const { isLoading } = useRequest(useStandardStore, 'initialData');
```

They take the store as an argument and type it **structurally**, so `packages/ui` needs no zustand
dependency — any store built with `createRequestSlice` satisfies the shape. `useLoadOnce` reads
`shouldLoad` through `getState()` inside the effect rather than from a subscription, so a status
change cannot re-run the effect and re-fire the fetch. The flattening itself is `toRequestView` in
`@repo/shared`: pure, so it is tested without a renderer.

One thing to know about both: **during SSR a zustand selector reads the store's initial state** —
zustand v5 passes `getInitialState` as the server snapshot — so a server-rendered screen always sees
`idle`. That is correct, since no fetch has run on the server, and it is what keeps hydration
consistent; but do not expect a status to survive a server render.

Component-side, the three statuses map one-to-one onto the three branches a screen needs, and the
loading branch's real job is to **guard the blank state**:

```tsx
if (isFailed) return <ErrorState message={error} onRetry={loadStandards} />;
if (isLoading) return <FullScreenLoader withHeader loading />;
return <DataTable rows={standards} columns={columns} />; // its BlankState now means "no data"
```

`DataTable` already renders `BlankState` on `rows.length === 0`. Today that fires for three
different situations — still loading, load failed, genuinely empty — so a user cannot tell an empty
table from a broken one. Reaching it only when `status === 'loaded'` is what makes it truthful.

**One open decision: there is no error component.** Nothing in the UI renders a failure today, which
is consistent with there being only 5 `catch` blocks across 28 stores. `status: 'error'` gives a
screen something real to show for the first time, and the choice is a retry-capable `ErrorState` in
`@repo/ui/app` or routing failures to the toast store. The toast store already exists and is already
migrated, so it is the cheaper default; decide before the second app.

### 9. A client row is `ClientEntity<Dto>`, not the DTO

`ResponseOf<T>` makes every ownership field required, because that is what the server sends. A store
also holds rows the user is still creating, and those have no `org`, no `createdBy` and no
timestamps until the first save. Typing a draft as the DTO therefore does not compile, and the
temptation is a cast — which decision 2 forbids.

`ClientEntity<T>` in `packages/shared/src/contracts/base.contract.ts` is the client-side mirror:
ownership fields optional, `_id` required because the client mints it with `getObjectId`, plus
`isNew`. Every store that can create a row uses it.

```ts
export type IStandard = ClientEntity<StandardDto>;
```

Note that the client-only field set is **per app**, not per entity: admin's standard and subject
carry `isNew` because admin creates them, while learning's and teaching's are read-only and do not.
So these aliases live in the app's store module, and only the DTO is shared. Decision 2's table
calls the `standard` and `subject` models byte-identical across apps — true of learning and
teaching, not of admin.

## The ordering constraint that "one store per commit" misses

Found while starting admin's `standard` store, and it changes the unit of migration.

`selector.store.ts` holds MST **views** that read another store:

```ts
get selectedStandard(): IStandard | undefined {
  return self.rootStore.standardStore.getStandardById(self.selectedStandardId);
},
```

If `standardStore` becomes Zustand while `selectorStore` is still MST, that view keeps returning
*correct data when called* — but MobX cannot track Zustand's state, so an `observer` component
reading `selectorStore.selectedStandard` **stops re-rendering when the standard changes**. Nothing
fails, nothing logs, the screen just goes stale. That is the worst possible failure mode for this
migration and a compiler cannot see it.

So the rule is: **a store may not migrate before the MST stores whose views read it. Where the
dependency is mutual, they migrate in one commit.**

Admin's graph makes the point — the edges run both ways:

| Store            | reaches    | how                                                     |
| ---------------- | ---------- | ------------------------------------------------------- |
| `standard`       | `selector` | actions: `setSelectedStandardId` after creating a draft |
| `selector`       | `standard` | **views**: `selectedStandard`, `selectedSubject`        |
| `standard.model` | `standard` | view: `subjects`, `referenceStandards` via `getRoot`    |
| `course`         | —          | none                                                    |

A write-only edge (`standard` → `selector`) is safe in either direction, because
`useSelectorStore.getState().setSelectedStandardId(id)` works from anywhere. It is the **read edge
from an MST view** that forces the pairing.

Practically, for each app: map the graph first with
`grep -o "rootStore\.[a-zA-Z]*Store" src/stores/*.store.ts src/stores/models/*.ts`, then migrate
leaves first and any read-cycle as a single commit. For admin that makes the units
**`{standard, selector}` together**, then `course`, then delete the root store — not the four
separate commits Phase 1 assumed.

## Sequencing

The rule: **the app builds and runs at the end of every step.** One store per commit, one app at a
time, smallest app first.

**Phase 0 — groundwork (no behaviour change)**

1. Add `InviteDto`, `RoleDto` and `UserDto` to `packages/shared/src/contracts/`, then
   `pnpm build:shared`. Everything else the stores model is already covered.
2. Move the shapes that do not depend on MST into `packages/shared/src/interfaces/`: `IBatchStat`
   and the reconciled `IMaterialStat`. A pure type move, verified by typecheck alone.

   **Two entries from the decision-2 table cannot move yet, and this only became clear on
   contact:**

   - `IToast` is `Instance<typeof ToastModel>` — MST-derived. Declaring it in `packages/shared`
     before the store migrates would create exactly the duplicate this migration removes, so it
     moves _with_ admin's toast store in the next step.
   - `IBatchUpsert` holds `batch: IBatch`, another MST instance type, so it waits for the batch
     store. Its sibling `IBatchUser` turns out to duplicate the existing `UserBatchMappingDto`
     contract and is only consumed by `BatchService.upsertBatchUserMappings`, which has **no
     callers**; delete both rather than move them.

   The general rule this implies: **a shape can move to `packages/shared` only once it no longer
   references an MST type.** For anything that does, the move happens in the same commit as its
   store, not in Phase 0.

3. Add `zustand` (5.0.15, peers `react >=18`) to the three apps.
4. Write one reference store end to end — **`toast` in admin**: 5 stores, 14 `observer` uses, 9
   `getRoot`, and the toast store is self-contained with an existing non-React caller. It sets the
   pattern everything else copies.
5. Add the two pieces every later store depends on, both in `packages/shared` (decisions 8 and 9):
   the request-state system (`IRequestState`, `IRequests`, the predicates, `createRequestSlice`) and
   `ClientEntity<T>`. Neither is app-specific, and writing them after the first few stores would
   mean rewriting those stores. Then `pnpm build:shared`.

**Phase 1 — admin (the rehearsal, 5 stores)**
`toast` (done) → **`{standard, selector}` in one commit** (done) → `course` → delete
`root.store.ts`. The pairing is forced by the read edge above. Admin is small enough that a mistake
is cheap and visible, and it exercises every mechanism: keyed maps, async load, cross-store reads,
and non-React access.

Three things the `{standard, selector}` step settled, which the remaining stores should copy:

- **Both cross-store edges were removed rather than reproduced.** The read edge became a composed
  hook (`useSelectedStandard`) that subscribes to each store separately; the write edge went to the
  caller, with `createStandard()` returning the new id for the component to select. Neither store
  imports the other, so the ordering constraint that forced the pairing does not exist in the result.
  Prefer this to porting a `getRoot` edge into `getState()` — see decision 5.
- **An upsert modal must read its row back after patching it.** MST mutated instances in place, so
  `selectedStandard.setLogo(url)` followed by `StandardService.upsertStandard(selectedStandard)`
  posted the new logo. With immutable rows the render-time copy is stale the moment you patch, and
  the upload silently never saves. Both admin modals now re-read through `getState()` between the
  patch and the post. **Every upsert modal in teaching and learning has this shape.**
- **Two bugs were fixed rather than carried across**: the `isLoading`/`isLoaded` typo (decision 8),
  and the fact that neither the Standards nor the Subjects screen ever triggered its load —
  `loadStandards` was called only after a modal save, so both tables showed `BlankState` regardless
  of what was in the database.

**Phase 2 — teaching (11 stores)**
`toast` (done) → `standard` (done) → then `batch`, `material`, `meet`, `question`, `test-paper`,
`user`, `course`, then `selector` (293 lines, the most connected), then delete the root store.

Teaching's graph looked like it broke this ordering: `selector` holds **17** cross-store views
spanning eight stores, so "selector last" seems to require it to migrate with everything. It does
not, and the resolution is the one from Phase 1 — **delete each view as its store migrates**, rather
than pair the stores:

- Each view is the same shape, `selectedX = xStore.getXById(selectedXId)`. When store X moves, its
  three or four views come out of `selector` and the lookup happens in the component, which reads
  the id from MST (still tracked by its `observer`) and the row from the Zustand store. Both
  subscriptions are real, so nothing goes stale.
- Consumers keep `observer` as long as they read *any* MST store, which during Phase 2 is most of
  them. It comes off per component in the commit that removes its last MST read.
- `useXLookups()` — a hook in the store module that subscribes to the store's maps and returns
  `getState()` — is what makes the ~26 consumers per store a one-line change each. See decision 4:
  selecting a lookup alone would never invalidate the component.

**Transitional hazard, to clear as Phase 2 proceeds.** Four MST views still read the Zustand standard
store through `getState()`, which cannot invalidate them:

| Site                                                           | Clears when           |
| -------------------------------------------------------------- | --------------------- |
| `models/course.model.ts` — `subjectItems`                      | `course` migrates     |
| `models/test-paper.model.ts` — `subjectItems`, `standardItems` | `test-paper` migrates |
| `user.store.ts` — `getStudentStandardsByStudentId`             | `user` migrates       |

Each carries a comment saying so. They are safe **only** because standards, subjects and mappings
are written exactly once, by `loadInitialData`, and every page is gated on `isLoadedInitialData` in
`SidebarLayout` — verified by grep, not assumed. Do not add a fifth.

**Phase 3 — learning (12 stores)**
Same order. `resource` and `test-paper` carry the exam flow, which is the most stateful part of the
codebase and should be last.

**Phase 4 — removal** (done)
The three packages came out of each app's manifest in the same commit that removed its last MST
store, so no commit ever had a manifest disagreeing with its code. `mobx-devtools-mst` — an admin
devDependency nothing imported — went too, which is what finally cleared mobx from
`pnpm-lock.yaml`. A `pnpm store prune` plus a clean reinstall from the lockfile confirmed it: no
mobx in `node_modules`, and not resolvable from any app. That reinstall also cleared an orphaned
`react@19.0.0-rc` from the virtual store, so there is now exactly one React.

**Phase 5 — documentation** (done)
`CLAUDE.md`, `add-app-screen` and `define-data-shape` are rewritten, and the smaller mentions in
`use-ui-component`, `extend-a-package`, `build-a-form`, `upgrade-a-dependency`, `DATA_CONTRACTS.md`
and `packages/ui/README.md` are updated. Two changes worth knowing:

- **The `no-restricted-imports` guard in `@repo/eslint-config` now bans `zustand` in
  `packages/ui`**, where it used to ban `mobx*`. The rule's intent never changed — a component
  there may not read app state — but naming an uninstalled package made it vacuous. The request
  hooks in `@repo/ui/hooks` type the store structurally for exactly this reason, so the ban is
  enforceable rather than aspirational.
- **`no-empty-object-type`'s `with-single-extends` allowance now protects nothing.** It was
  calibrated for `interface IUser extends Instance<typeof User> {}`, the MST instance pattern, and
  a grep finds no single-extends interface left. The option stays with a comment saying so;
  tightening it is a separate change.

## Verification, and why this needs a human

The repo has **no test suite**. Typecheck and lint will catch the shape of the migration; they will
not catch a re-render regression, a stale selector, or a screen that silently stops updating.

Per store commit, alongside the ladder:

- **no new `any`, no new `as`** — `git diff | grep -nE ': any|as [A-Z]'` on the diff, and
  `pnpm lint` must stay at 0 errors.
- **nothing app-local that two apps need** — if the same shape appears in the second app's
  conversion, stop and move it to `packages/shared` in that commit rather than copying it.
- **no `isLoading*` or `isLoaded*` field survives** in the converted store —
  `grep -nE "isLoad(ing|ed)" src/stores/<name>.store.ts` returns nothing, because every fetch went
  through `createRequestSlice` (decision 8). Check the loaders' last lines while you are there: the
  typo this replaces is in all three apps.
- **every collection selector has `useShallow`** — `grep -n "useStandardStore((" ` on the converted
  components and confirm nothing returns `Object.values`, `.filter`, `.map` or `.sort` bare.
- **every upsert modal re-reads its row** between patching it and posting it, per Phase 1.

Then:

```bash
env -u _VOLTA_TOOL_RECURSION volta run --node 24.21.0 -- pnpm exec tsc --noEmit   # in the app
pnpm lint                                                                         # 0 errors
pnpm build:<app>
```

Then, and this is the part that cannot be skipped: **open the screens that store drives** and check
they still load, update and reset. For each converted store, note in the commit which screens were
exercised. A migration this size with no tests is carried by that discipline alone.

`grep -c "observer(" ` per app is a useful progress signal: it should fall to zero.

## What could go wrong

| Risk                                                           | Mitigation                                                                                                     |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Re-render regressions from array/object selectors              | `useShallow` on every collection selector; review each converted view                                          |
| A save posts a stale row, so an edit silently does not persist | Re-read through `getState()` between the last patch and the request — the one that bit admin was a logo upload |
| Circular imports between stores                                | Read peers via `getState()` inside action bodies, never at module scope                                        |
| A screen stops updating and nobody notices                     | Manual pass per store, recorded in the commit message                                                          |
| Half-migrated state drags on                                   | One store per commit; both libraries installed until Phase 4                                                   |
| Contracts missing for some entities                            | Phase 0 blocks on extending `contracts/`                                                                       |

## What this does not change

The HTTP layer, `toPayload`, the DTOs, the server, and the client-only key list. Requests keep the
same shape, because the store shape was never what the API saw.

## Estimate

Phase 0 is half a day. Admin is a day. Teaching and learning are two to three days each, dominated by
the manual screen passes rather than the code. Call it **a week of focused work**, and it is the kind
of work that goes badly if rushed across three apps at once — which is why the sequencing above never
has more than one store in flight.
