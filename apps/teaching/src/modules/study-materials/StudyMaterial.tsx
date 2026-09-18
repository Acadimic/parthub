import { type MaterialDto } from '@repo/shared/contracts';
import { Accordions, Button, Card, Loader, SoftConfirmModal } from '@repo/ui/app';
import { PencilIcon, PlusIcon, TrashIcon, UploadSimpleIcon } from '@phosphor-icons/react';
import { BlankState } from '@components/others';
import {
  useMaterialLookups,
  useMaterialStore,
  useSelectorStore,
  useStandardLookups,
  useSelectorLookups,
} from '@stores';
import { errorToast, successToast } from '@utils/helpers';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useSetState } from 'react-use';
import { GenerateMaterialModal, StudyMaterialDetails, StudyMaterialView, UpsertMaterialModal } from './components';

interface IProps {
  standardId: string;
  subjectId: string;
}

interface IState {
  isOpenUpsertModal: boolean;
  isOpenGenerateModal: boolean;
  /** The material the delete confirm is asking about, or `null` when it is closed. */
  materialToDelete: MaterialDto | null;
  isDeleting: boolean;
}

export const StudyMaterial = ({ standardId, subjectId }: IProps) => {
  const { push } = useRouter();
  const selectorStore = useSelectorLookups();
  const materialStore = useMaterialLookups();
  const standardStore = useStandardLookups();
  const { getStandardById, getSubjectById, loadStandardSubjectChapters } = standardStore;
  const { setSelectedMaterialId, removeSelectedMaterialId, setSelectedStandardId, setSelectedSubjectId } =
    selectorStore;
  const { loadStandardSubjectMaterials, getStandardSubjectMaterials, createMaterial, deleteMaterials } = materialStore;
  const isLoadingMaterials = materialStore.isLoading('materials');
  // The reference data the sidebar loads after sign-in; the standard and subject ids in the URL
  // cannot be resolved before it arrives.
  const isLoadedStandards = standardStore.isLoaded('initialData');
  const standard = getStandardById(standardId);
  const subject = getSubjectById(subjectId);
  // Saved rows only: a draft being typed into the drawer is not content yet, and counting it would
  // put "5 contents" on a page that shows four.
  const materials = getStandardSubjectMaterials(standardId, subjectId).filter((material) => !material.isNew);
  const [state, setState] = useSetState<IState>({
    isOpenUpsertModal: false,
    isOpenGenerateModal: false,
    materialToDelete: null,
    isDeleting: false,
  });

  const onOpenAddModal = () => {
    // The new row has to be selected as well as created: the modal renders its body from
    // `useSelectedMaterial()`, so without this it opened empty — no title field, no editor, just
    // the footer. That is why `createMaterial` returns the row.
    const material = createMaterial(standardId, subjectId);
    setSelectedMaterialId(material._id);
    setState({ isOpenUpsertModal: true });
  };

  const onCloseUpsertModal = () => {
    // Read the draft at call time rather than from the render closure. This used to close over the
    // `selectedMaterial` of the render that opened the dialog — still `isNew` — so the row the user
    // had just saved was discarded from the store on the way out, and the content vanished.
    const materialId = useSelectorStore.getState().selectedMaterialId;
    const material = useMaterialStore.getState().getMaterialById(materialId);
    if (material?.isNew) useMaterialStore.getState().removeMaterialById(material._id);
    setState({ isOpenUpsertModal: false });
    removeSelectedMaterialId();
  };

  const editMaterial = (material: MaterialDto) => {
    setSelectedMaterialId(material._id);
    setState({ isOpenUpsertModal: true });
  };

  const generateMaterial = (material: MaterialDto) => {
    setSelectedMaterialId(material._id);
    setState({ isOpenGenerateModal: true });
  };

  const onCloseGenerateModal = () => {
    setState({ isOpenGenerateModal: false });
    removeSelectedMaterialId();
  };

  const onCloseDeleteModal = () => {
    if (state.isDeleting) return;
    setState({ materialToDelete: null });
  };

  const onConfirmDelete = async () => {
    const material = state.materialToDelete;
    if (!material) return;
    try {
      setState({ isDeleting: true });
      await deleteMaterials([material._id]);
      successToast({ message: 'Content deleted successfully!' });
      setState({ materialToDelete: null });
    } catch (error) {
      // `callAuthApi` has already toasted an HTTP failure; anything else has no message of its own.
      if (!(error instanceof Error)) errorToast({ message: 'Could not delete the content.' });
    } finally {
      setState({ isDeleting: false });
    }
  };

  useEffect(() => {
    if (!standardId || !subjectId) return;
    setSelectedStandardId(standardId);
    setSelectedSubjectId(subjectId);
    const payload = { standard: standardId, subject: subjectId };
    loadStandardSubjectMaterials(payload);
    loadStandardSubjectChapters(payload);
  }, [standardId, subjectId]);

  useEffect(() => {
    // Only once the reference data has arrived. Redirecting on a missing standard alone sent every
    // refresh of this URL straight back to the list, because the maps are empty until then.
    if (isLoadedStandards && (!standard || !subject)) push('/study-materials');
  }, [isLoadedStandards, standard, subject]);

  if (!standard || !subject) return <Loader isLoading />;

  // `updatedAt` is absent on a row saved once and never edited, so fall back to when it was created
  // rather than reporting the subject as never updated.
  const maxLastUpdatedAt = materials.reduce<string>((max, material) => {
    const updatedAt = material.updatedAt ?? material.createdAt ?? '';
    return updatedAt > max ? updatedAt : max;
  }, '');

  const addButton = (
    <Button leftsection={<PlusIcon weight="bold" className="w-4 h-4" />} onClick={onOpenAddModal}>
      Add <span className="hidden sm:inline">Content</span>
    </Button>
  );

  return (
    <div className="flex flex-col gap-3">
      <Card>
        <StudyMaterialDetails
          standard={standard}
          subject={subject}
          count={materials.length}
          lastUpdatedAt={maxLastUpdatedAt}
        />
      </Card>
      {materials.length > 0 && (
        <>
          <div className="flex justify-end">{addButton}</div>
          <Accordions
            items={materials.map((material, index) => {
              const attachmentCount = (material.attachments ?? []).length;
              return {
                title: (
                  // Text only: the accordion renders its title inside the toggle button, so a menu
                  // or a button here would be an interactive element nested in another one. The
                  // actions moved into the panel below.
                  <div className="flex w-full items-center gap-2">
                    <span className="text-sm font-bold text-foreground">
                      <span className="text-muted-foreground">{index + 1}.</span> {material.name}
                    </span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {attachmentCount} attachment{attachmentCount === 1 ? '' : 's'} · {material.durationMins ?? 0} mins
                    </span>
                  </div>
                ),
                component: (
                  <div className="flex flex-col gap-3 px-4 pb-4">
                    <div className="flex flex-wrap justify-end gap-2 border-b border-border pb-2">
                      <Button
                        isSubtle
                        text="Edit"
                        leftsection={<PencilIcon weight="bold" className="w-4 h-4" />}
                        onClick={() => editMaterial(material)}
                      />
                      <Button
                        isSubtle
                        text="Generate"
                        leftsection={<UploadSimpleIcon weight="bold" className="w-4 h-4" />}
                        onClick={() => generateMaterial(material)}
                      />
                      <Button
                        isSubtle
                        isDestructive
                        text="Delete"
                        leftsection={<TrashIcon weight="bold" className="w-4 h-4" />}
                        onClick={() => setState({ materialToDelete: material })}
                      />
                    </div>
                    <StudyMaterialView material={material} />
                  </div>
                ),
              };
            })}
          />
        </>
      )}
      {materials.length === 0 && isLoadingMaterials && <Loader isLoading />}
      {materials.length === 0 && !isLoadingMaterials && (
        <BlankState
          label="No content yet"
          description={`Add the first piece of ${subject.name} content for ${standard.name}.`}
          action={addButton}
        />
      )}
      <UpsertMaterialModal isOpen={state.isOpenUpsertModal} onClose={onCloseUpsertModal} />
      <GenerateMaterialModal isOpen={state.isOpenGenerateModal} onClose={onCloseGenerateModal} />
      <SoftConfirmModal
        isOpen={!!state.materialToDelete}
        isDestructive
        isLoading={state.isDeleting}
        title="Delete content"
        description={`"${state.materialToDelete?.name || 'This content'}" will be removed for your learners. This cannot be undone.`}
        confirmText="Delete"
        onConfirm={onConfirmDelete}
        onCancel={onCloseDeleteModal}
      />
    </div>
  );
};
