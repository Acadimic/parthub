import { type MaterialDto } from '@repo/shared/contracts';
import { Button, Card, SoftConfirmModal, ExpandAllButton } from '@repo/ui/app';
import { useExpandedIds } from '@repo/ui/hooks';
import { PlusIcon, SparkleIcon, WrenchIcon } from '@phosphor-icons/react';
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
import { useMaterialRepair } from '@hooks/material-repair.hook';
import { useCallback, useEffect } from 'react';
import { useSetState } from 'react-use';
import {
  AiMaterialDrawer,
  GenerateMaterialModal,
  MaterialCard,
  StudyMaterialHeader,
  StudyMaterialSkeleton,
  UpsertMaterialModal,
} from './components';

interface IProps {
  standardId: string;
  subjectId: string;
}

interface IState {
  isOpenUpsertModal: boolean;
  isOpenGenerateModal: boolean;
  isOpenAi: boolean;
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
  const { isExpanded, isAllExpanded, toggle, toggleAll } = useExpandedIds(materials.map((material) => material._id));
  const [state, setState] = useSetState<IState>({
    isOpenUpsertModal: false,
    isOpenGenerateModal: false,
    isOpenAi: false,
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

  const editMaterial = useCallback(
    (material: MaterialDto) => {
      setSelectedMaterialId(material._id);
      setState({ isOpenUpsertModal: true });
    },
    [setSelectedMaterialId, setState],
  );

  const generateMaterial = useCallback(
    (material: MaterialDto) => {
      setSelectedMaterialId(material._id);
      setState({ isOpenGenerateModal: true });
    },
    [setSelectedMaterialId, setState],
  );

  const requestDeleteMaterial = useCallback(
    (material: MaterialDto) => {
      setState({ materialToDelete: material });
    },
    [setState],
  );

  const onCloseGenerateModal = () => {
    setState({ isOpenGenerateModal: false });
    removeSelectedMaterialId();
  };

  const { onRepairMaterial, onRepairAll, isRepairing } = useMaterialRepair(materials);

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

  if (!standard || !subject) return <StudyMaterialSkeleton />;

  // `updatedAt` is absent on a row saved once and never edited, so fall back to when it was created
  // rather than reporting the subject as never updated.
  const maxLastUpdatedAt = materials.reduce<string>((max, material) => {
    const updatedAt = material.updatedAt ?? material.createdAt ?? '';
    return updatedAt > max ? updatedAt : max;
  }, '');
  const durationMins = materials.reduce((total, material) => total + (material.durationMins ?? 0), 0);
  const attachmentCount = materials.reduce((total, material) => total + (material.attachments ?? []).length, 0);
  const isLoadingFirst = isLoadingMaterials && materials.length === 0;

  const renderContents = () => {
    if (isLoadingFirst) return <StudyMaterialSkeleton />;
    if (!materials.length) {
      return (
        <BlankState
          label="No content yet"
          description={`Let AI research and write a graded set of ${subject.name} lessons for ${standard.name}, or add the first piece by hand.`}
          className="rounded-lg border border-border bg-background py-12"
          action={
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button
                leftsection={<SparkleIcon weight="bold" className="h-4 w-4" />}
                text="Generate lessons with AI"
                onClick={() => setState({ isOpenAi: true })}
              />
              <Button
                isSecondary
                leftsection={<PlusIcon weight="bold" className="h-4 w-4" />}
                text="Add content"
                onClick={onOpenAddModal}
              />
            </div>
          }
        />
      );
    }
    return (
      <section className="rounded-lg border border-border bg-background">
        <header className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">Contents</h2>
          <div className="ml-auto flex items-center gap-2">
            {materials.length > 1 ? <ExpandAllButton isAllExpanded={isAllExpanded} onClick={toggleAll} /> : null}
            <Button
              isSubtle
              leftsection={<WrenchIcon weight="bold" className="h-4 w-4" />}
              text="Repair equations"
              title="Fix equations that arrived broken from an AI import"
              onClick={onRepairAll}
              isLoading={isRepairing}
            />
            <Button
              isSecondary
              leftsection={<SparkleIcon weight="bold" className="h-4 w-4" />}
              text="Generate with AI"
              onClick={() => setState({ isOpenAi: true })}
            />
          </div>
        </header>
        <div className="flex flex-col gap-2 p-3">
          {materials.map((material, index) => (
            <MaterialCard
              key={material._id}
              material={material}
              number={index + 1}
              isExpanded={isExpanded(material._id)}
              onToggle={toggle}
              onEdit={editMaterial}
              onGenerate={generateMaterial}
              onRepair={onRepairMaterial}
              onDelete={requestDeleteMaterial}
            />
          ))}
        </div>
      </section>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <Card className="px-5 py-5 border rounded-lg">
        <StudyMaterialHeader
          standard={standard}
          subject={subject}
          contentCount={materials.length}
          durationMins={durationMins}
          attachmentCount={attachmentCount}
          lastUpdatedAt={maxLastUpdatedAt || undefined}
          onAddContent={onOpenAddModal}
        />
      </Card>
      {renderContents()}
      <UpsertMaterialModal isOpen={state.isOpenUpsertModal} onClose={onCloseUpsertModal} />
      <GenerateMaterialModal isOpen={state.isOpenGenerateModal} onClose={onCloseGenerateModal} />
      <AiMaterialDrawer
        isOpen={state.isOpenAi}
        onClose={() => setState({ isOpenAi: false })}
        standardId={standardId}
        subjectId={subjectId}
      />
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
