---
description: >
  Add or change a screen in apps/learning, apps/teaching or apps/admin — the Next.js Pages Router
  page, the feature module that holds the UI, and the MobX State Tree store wiring behind it. These
  three apps share one shape: a page is four lines and declares its layout, the module is an
  `observer` that reads `useStores()`, and every async call is an MST `flow`. This skill keeps a new
  screen indistinguishable from the existing ones.
when_to_use: >
  Trigger BEFORE adding or editing anything under an app's src/pages, src/modules, src/layouts or
  src/stores. Specifically: (1) a request for a new page, screen, tab, route or dialog in any of the
  three apps; (2) a screen that needs data from the server; (3) adding an action, view or model to a
  store; (4) you are about to write `getServerSideProps` or `getStaticProps`, which this codebase
  does not use.
argument-hint: '[the screen or store change]'
---

# Add an app screen

All three apps are Next.js 15 on the **Pages Router** with MobX State Tree. They are structurally
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
   run time; the Pages Router needs no client directive. Adding SSR to one screen breaks the
   assumption `_app.tsx` makes about the store being a client singleton.
3. **Any component reading a store is wrapped in `observer`** from `mobx-react-lite`. Without it
   the screen silently stops re-rendering when the store changes.
4. **State lives in the store; a component holds only view state.** `isOpenUpsertBatchModal` is
   view state. A loaded entity, a loading flag that survives navigation, or anything a second screen
   reads is store state.
5. **Async store work is `flow(function* () { ... })`**, never `async` in an action. MST cannot
   track mutations after an `await`.
6. **UI comes from the library.** Run the `use-ui-component` skill before writing any control. An
   app may not import `@repo/ui/ui/*` — ESLint fails the build on it.
7. **Import through the path aliases** (`@modules/*`, `@components/*`, `@stores`, `@services`,
   `@utils/*`, `@enums`, `@interfaces`, `@layouts`, `@hooks/*`). Climbing `../../../` is an ESLint
   error. Import `@repo/ui/core` and `@repo/ui/app` directly — the apps have no pass-through barrels.
8. **A client-generated `_id` uses `getObjectId()`** (from `@utils/helpers`, which re-exports
   `@repo/ui/lib`) so the first write is an upsert rather than a create, and the row is addressable
   before the server has seen it.

## should

- Mirror the folder shape: `src/modules/<feature>/<Feature>.tsx` for the screen, `components/` for
  parts only this feature uses, `index.ts` exporting the screen. A part a second feature wants goes
  to `packages/ui` instead — see `use-ui-component`.
- Keep view state in one `useSetState<IState>` object rather than five `useState` calls, matching
  the existing screens.
- Read entities through a store view (`get batches`, `getBatchById`), not by reaching into the
  `t.map` directly. Stores keep entities in `t.map` keyed by `_id`; the array views exist for the UI.
- Declare a table's row type: `const columns: IColumnData<IBatch>[]`. `DataTable` is generic over
  it, and `IMenuItem.onClick` receives the row optionally, so a handler that needs it guards:
  `onClick: (row) => row && editBatch(row)`.
- Guard a load with the store's own `isLoaded*` flag so a remount does not refetch.
- Leave no `console.log`. The ESLint "should" tier warns on it.

## The shape of a screen

```tsx
export const Batches = observer(() => {
  const { push } = useRouter();
  const { batchStore, selectorStore } = useStores();
  const { batches, isLoadingBatchesData, isLoadedBatchesData, loadBatchesData } = batchStore;
  const [state, setState] = useSetState<IState>({ isOpenUpsertBatchModal: false });

  useEffect(() => {
    if (!isLoadedBatchesData) loadBatchesData();
  }, [isLoadedBatchesData]);

  const columns: IColumnData<IBatch>[] = [
    { label: 'Name', dataKey: 'name' },
    { label: 'Actions', dataKey: ACTIONS, menuItems: [{ label: 'Edit', onClick: (row) => row && editBatch(row) }] },
  ];

  if (isLoadingBatchesData) return <FullScreenLoader />;
  return <DataTable rows={batches} columns={columns} />;
});
```

## Steps

1. Read the same screen in a sibling app, or the nearest one in this app.
2. If the screen needs data no endpoint returns, run the `add-api-endpoint` skill first.
3. If it needs a new entity or field on the client, run the `define-data-shape` skill.
4. Build the module component from `@repo/ui/core` and `@repo/ui/app` (`use-ui-component` decides
   which).
5. Add the page shim and its `layout`.
6. Add the store action or view if the screen introduced one, as a `flow` for anything async.
7. Verify with the `verify-changes` skill.

## Where the layouts come from

`Layout` is a shared enum (`@repo/shared/enums`, re-exported by each app's `@enums`):
`SIDEBAR`, `AUTH`, `EXAM`, `PAGE`, `PAGE_NAVIGATION`, `PUBLIC`, `ERROR`, `NONE`. The components
live in the app's `src/layouts`. Use an existing value; a new one means a new layout component and
a change to `_app.tsx`.
