---
description: >
  Build a form or an edit dialog in one of the apps. Every create-or-update screen here follows the
  same shape — a Modal with a ModalFooter, one useSetState object holding the fields plus isLoading,
  validateFieldValues before the write, a toast after it, and the write going through the store and
  its service. Use this so a new form behaves like the fifteen that already exist.
when_to_use: >
  Trigger BEFORE writing any form, edit dialog, upsert modal, filter panel or settings pane in
  apps/learning, apps/teaching or apps/admin; when adding a field to an existing one; when wiring a
  save button; and when you are about to write your own validation, your own error text, or a fetch
  call from a component.
argument-hint: '[what the form edits]'
---

# Build a form

Read `apps/teaching/src/modules/batches/components/UpsertBatchModal.tsx` first — it is the
canonical version of this pattern. There is no form library: state is a single `useSetState`
object, validation is one helper, and the write goes through the store.

## must

1. **Inputs come from the library.** Run `use-ui-component` first. The core input API is narrower
   than a generic React one, so use it as designed:

   | Prop          | Type      | Meaning                                    |
   | ------------- | --------- | ------------------------------------------ |
   | `label`       | `string`  | rendered by the wrapper, not by you        |
   | `required`    | `boolean` | draws the asterisk on the label            |
   | `error`       | `boolean` | turns the border and helper text red       |
   | `helperText`  | `string`  | the message shown under the control        |
   | `disabled`    | `boolean` | set it from `state.isLoading`              |

   `error` is a flag, not a message — the message goes in `helperText`.

2. **One state object, including `isLoading`.**

   ```ts
   interface IState {
     name: string;
     standard: string;
     isLoading: boolean;
   }
   const [state, setState] = useSetState<IState>({ name: '', standard: '', isLoading: false });
   ```

   Every input gets `disabled={state.isLoading}`. Do not spread five `useState` calls across the
   component.

3. **Validate with `validateFieldValues`** from `@utils/helpers`, which takes the state object and
   the required field names, returns the names that are empty (an empty array counts as empty), and
   raises an error toast naming the first one. Bail when it returns anything:

   ```ts
   const errors = validateFieldValues(state, ['name', 'standard']);
   if (errors.length) return;
   ```

   Do not hand-roll a second validation style. If a field needs a rule the helper cannot express,
   check it explicitly *after* this call and toast the reason yourself.

4. **Feedback is a toast.** `successToast` / `errorToast` / `warnToast` from `@utils/helpers`, which
   write to the app's toast store. Never `alert`, and never leave a failure visible only in the
   console.

5. **The dialog does not own its own visibility.** Take `isOpen` and `onClose` as props, and refuse
   to close mid-save:

   ```ts
   const closeModal = () => {
     if (state.isLoading) return;
     if (selectedBatch?.isNew) removeBatchById(selectedBatch._id);  // discard the local draft
     onClose();
   };
   ```

   That second line matters: a record created locally by `createBatch` exists in the store before
   the server has seen it, so cancelling must remove it or it lingers in the list.

6. **Write through the store and its service, never a fetch from the component.** The `_id` is
   generated on the client, so every save is an upsert, and a successful create ends with
   `resetIsNew()`:

   ```ts
   const batch = selectedBatch || createBatch(state.name, state.standard);
   batch.setName(state.name);
   const isNewBatch = batch.isNew;
   await BatchService.upsertBatch({ batch, users: [...state.collaborators, ...state.students] });
   successToast({ message: isNewBatch ? 'Batch created successfully!' : 'Batch updated successfully!' });
   await loadBatchesData();
   batch.resetIsNew();
   onClose();
   ```

7. **Do not clean the payload by hand.** Each app's `http.service.ts` runs every body through
   `toPayload`, so UI-only keys such as `isNew` are already gone. Picking fields manually just
   drifts from the DTO.

8. **Select what the form reads,** rather than taking a whole store object. A row comes from a leaf
   selector or a `useSelectedX()` hook; a derived list needs `useShallow`. Without a real subscription the form will
   not react when the record it is editing changes.

## should

- Wrap it in the app `Modal` with a `ModalFooter`, which is where the save and cancel buttons and
  their loading state live:

  ```tsx
  <Modal
    position={PositionType.RIGHT}
    title={`${record && !record.isNew ? 'Update' : 'Create'} Batch`}
    isOpen={isOpen}
    isLoading={state.isLoading}
    onClose={closeModal}
    component={<div className="min-h-[60vh] pb-4">{/* fields */}</div>}
    footer={
      <ModalFooter saveText="Save" cancelText="Cancel" onSave={handleSave} onCancel={closeModal} isLoading={state.isLoading} />
    }
  />
  ```

  Derive the create-or-update wording from the record, and read the condition carefully: a record
  that is `isNew` is being **created**, not updated.

- Hydrate an edit form from the record in a `useEffect` keyed on its `_id`, so switching rows
  refills the fields:
  `useEffect(() => { if (record) setState({ name: record.name }); }, [record?._id]);`
- Order the save path: validate, mutate the model, call the service, toast, reload, `resetIsNew`,
  close. Toasting before the await means lying to the user.
- `try / catch / finally`, with `finally` clearing `isLoading` so a failed save leaves a usable
  form.
- Mind which `Select` you are importing: the app-level one (`@components/app/selects`) takes
  `items`, while the core wrapper (`@repo/ui/core`) takes `options`. Both take `values: string[]`
  and hand back `ISelectItem[]`.
- Lay fields out with the existing rhythm — `flex flex-col space-y-3`, and
  `flex flex-col md:flex-row gap-3` with `w-full md:w-[50%]` for a pair on one row. See
  `style-with-tailwind`.
- A field the server must store needs a DTO field too: run `define-data-shape`, then
  `add-api-endpoint`.

## Related skills

- `use-ui-component` — which input already exists, and how to add one that does not
- `style-with-tailwind` — tokens, spacing and responsive rules for the layout
- `add-app-screen` — the page and store around the form
- `define-data-shape` / `add-api-endpoint` — when a field has to persist
