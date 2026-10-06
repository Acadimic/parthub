---
description: >
  Add or change a screen in apps/learning, apps/teaching or apps/support — the Next.js Pages Router
  page, the feature module that holds the UI, and the Zustand store wiring behind it. These three
  apps share one shape: a page is four lines and declares its layout, the module selects from one or
  more stores, and every fetch goes through the store's request slice. This skill keeps a new screen
  indistinguishable from the existing ones.
when_to_use: >
  Trigger BEFORE adding or editing anything under an app's src/pages, src/modules, src/layouts or
  src/stores. Specifically: (1) a request for a new page, screen, tab, route or dialog in any of the
  three apps; (2) a screen that needs data from the server; (3) adding an action, lookup or entity to
  a store; (4) you are about to write `getServerSideProps` or `getStaticProps`, which this codebase
  does not use.
argument-hint: '[the screen or store change]'
---

# Add an app screen

All three apps are Next.js 16 on the **Pages Router** with Zustand. They are structurally
identical, so read the equivalent screen in a sibling app before inventing anything.

## must

1. **A page is a thin shim.** It renders one module component and declares its layout. No data
   fetching, no state, no markup:

   ```tsx
   import { Layout } from '@enums';
   import { Batches } from '@modules/batches';

   function BatchesPage() {
     return <Batches />;
   }

   BatchesPage.layout = Layout.SIDEBAR;

   export default BatchesPage;
   ```

   `_app.tsx` reads `Component.layout` and wraps the page. A page without it renders bare.

2. **No `getServerSideProps` / `getStaticProps` / `"use client"`.** Data comes from the stores at
   run time; the Pages Router needs no client directive. Note that a Zustand selector reads the
   store's *initial* state during SSR, so a server-rendered screen always sees an idle request.
3. **A hook selects data; `getState()` calls behaviour.** Selecting a lookup such as `getBatchById`
   hands back a stable function reference, so calling it during render compiles, reads correct data
   and **never re-renders** — the screen goes stale with nothing to show for it. Use the store's
   `useXLookups()` hook, which subscribes to the maps its lookups read; use `useXStore.getState()`
   inside an event handler, where no subscription is wanted.
4. **A derived collection needs `useShallow`.** `useBatchStore((s) => s.getBatches())` builds a new
   array on every call and would re-render on any change:
   `useBatchStore(useShallow((s) => s.getBatches()))`.
5. **State lives in the store; a component holds only view state.** `isOpenUpsertBatchModal` is
   view state. A loaded entity, fetch state that survives navigation, or anything a second screen
   reads is store state. A submit button's busy flag is view state — keep it local.
6. **Fetch state comes from the request slice, never a boolean.** A store declares its fetch names
   and `run(key, fetcher)` owns every transition. A component reads `isLoading('batchesData')`, or
   better `useLoadOnce`. Never add an `isLoading*` field to a store.
7. **An upsert modal re-reads its row before posting.** The store holds immutable rows, so the copy
   captured during render is stale the moment you patch it: patch, read back through `getState()`,
   then post. Skipping this is how a logo upload silently fails to save.
8. **UI comes from the library.** Run the `use-ui-component` skill before writing any control. An
   app may not import `@repo/ui/ui/*` — ESLint fails the build on it.
9. **Import through the path aliases** (`@modules/*`, `@components/*`, `@stores`, `@services`,
   `@utils/*`, `@enums`, `@interfaces`, `@layouts`, `@hooks/*`). Climbing `../../../` is an ESLint
   error. Import `@repo/ui/core` and `@repo/ui/app` directly — the apps have no pass-through barrels.
10. **A client-generated `_id` uses `getObjectId()`** (from `@utils/helpers`, which re-exports
    `@repo/ui/lib`) so the first write is an upsert rather than a create, and the row is addressable
    before the server has seen it.

## should

- Mirror the folder shape: `src/modules/<feature>/<Feature>.tsx` for the screen, `components/` for
  parts only this feature uses, `index.ts` exporting the screen. A part a second feature wants goes
  to `packages/ui` instead — see `use-ui-component`.
- Keep view state in one `useSetState<IState>` object rather than five `useState` calls, matching
  the existing screens.
- Read entities through the store's lookups (`getBatches()`, `getBatchById(id)`), not by reaching
  into the map directly. Stores keep entities in a `Record<string, T>` keyed by `_id`; the array
  getters exist for the UI.
- Merge rows in an `add*` action (`{ ...map[id], ...row }`) when the list route sends fewer fields
  than a read by id, as materials and courses do; replacing would drop what the full read brought.
  A screen that needs the omitted field fetches it first (`requestFullMaterials`, `loadCourse`).
- Put a derivation in the store, not in a selector. A `useShallow` selector says *how to compare*;
  anything with more than one step — a lookup chained into a `map`, a `reduce`, a `filter` encoding
  a rule — becomes a named store method.
- Declare a table's row type: `const columns: IColumnData<IBatch>[]`. `DataTable` is generic over
  it, and `IMenuItem.onClick` receives the row optionally, so a handler that needs it guards:
  `onClick: (row) => row && editBatch(row)`.
- Load with `useLoadOnce(useBatchStore, 'batchesData', (s) => s.loadBatchesData)`: it fetches once,
  reports the status, and retries after a failure. Call the loader directly when you want an
  unconditional refetch, such as after a save.
- Leave no `console.log`. The ESLint "should" tier warns on it.

## The shape of a screen

```tsx
export const Batches = () => {
  const { push } = useRouter();
  const setSelectedBatchId = useSelectorStore((state) => state.setSelectedBatchId);
  // A derived array, so the selector needs a shallow compare.
  const batches = useBatchStore(useShallow((state) => state.getBatches()));
  // Fetches once on mount, and reports the status.
  const { isLoading, isFailed, error } = useLoadOnce(useBatchStore, 'batchesData', (s) => s.loadBatchesData);
  const [state, setState] = useSetState<IState>({ isOpenUpsertBatchModal: false });

  const columns: IColumnData<IBatch>[] = [
    { label: 'Name', dataKey: 'name' },
    { label: 'Actions', dataKey: ACTIONS, menuItems: [{ label: 'Edit', onClick: (row) => row && editBatch(row) }] },
  ];

  // Order matters: the loading branch guards the blank state, so `DataTable`'s own `BlankState`
  // means "no data" rather than "not loaded yet".
  if (isFailed) return <ErrorState message={error} />;
  if (isLoading) return <FullScreenLoader withHeader loading />;
  return <DataTable rows={batches} columns={columns} />;
};
```

## Steps

1. Read the same screen in a sibling app, or the nearest one in this app.
2. If the screen needs data no endpoint returns, run the `add-api-endpoint` skill first.
3. If it needs a new entity or field on the client, run the `define-data-shape` skill.
4. Build the module component from `@repo/ui/core` and `@repo/ui/app` (`use-ui-component` decides
   which).
5. Add the page shim and its `layout`.
6. Add the store action or lookup if the screen introduced one. Anything async goes through
   `run(key, fetcher)`, and a new fetch name joins the store's `createRequestSlice` list.
7. Verify with the `verify-changes` skill.

## Where the layouts come from

`Layout` is a shared enum (`@repo/shared/enums`, re-exported by each app's `@enums`):
`SIDEBAR`, `AUTH`, `EXAM`, `PAGE`, `PAGE_NAVIGATION`, `PUBLIC`, `ERROR`, `NONE`. The components
live in the app's `src/layouts`. Use an existing value; a new one means a new layout component and
a change to `_app.tsx`.
