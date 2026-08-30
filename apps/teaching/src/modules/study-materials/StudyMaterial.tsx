import { Accordions, Button, Card, Loader, Menu } from '@components/app';
import { Pencil, Plus, Trash, UploadSimple } from '@phosphor-icons/react';
import { BlankState } from '@components/others';
import { IMaterial, useStores } from '@stores';
import { observer } from 'mobx-react-lite';
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
}

export const StudyMaterial = observer(({ standardId, subjectId }: IProps) => {
  const { push } = useRouter();
  const { selectorStore, standardStore, materialStore } = useStores();
  const { getStandardById, getSubjectById, loadStandardSubjectChapters } = standardStore;
  const {
    selectedMaterial,
    setSelectedMaterialId,
    removeSelectedMaterialId,
    setSelectedStandardId,
    setSelectedSubjectId,
  } = selectorStore;
  const {
    loadStandardSubjectMaterials,
    standardSubjectMaterials,
    createMaterial,
    removeMaterialById,
    isLoadingMaterials,
  } = materialStore;
  const standard = getStandardById(standardId);
  const subject = getSubjectById(subjectId);
  const materials = standardSubjectMaterials(standardId, subjectId);
  const [state, setState] = useSetState<IState>({
    isOpenUpsertModal: false,
    isOpenGenerateModal: false,
  });

  const onOpenAddModal = () => {
    createMaterial(standardId, subjectId);
    setState({ isOpenUpsertModal: true });
  };

  const onCloseAddModal = () => {
    if (selectedMaterial?.isNew) removeMaterialById(selectedMaterial._id);
    setState({ isOpenUpsertModal: false });
    removeSelectedMaterialId();
  };

  const editMaterial = (material: IMaterial) => {
    setSelectedMaterialId(material._id);
    setState({ isOpenUpsertModal: true });
  };

  const generateMaterial = (material: IMaterial) => {
    setSelectedMaterialId(material._id);
    setState({ isOpenGenerateModal: true });
  };

  const onCloseGenerateModal = () => {
    setState({ isOpenGenerateModal: false });
    removeSelectedMaterialId();
  };

  useEffect(() => {
    if (!standard || !subject) push('/study-materials');
    else {
      setSelectedStandardId(standardId);
      setSelectedSubjectId(subjectId);
      const payload = { standard: standardId, subject: subjectId };
      loadStandardSubjectMaterials(payload);
      loadStandardSubjectChapters(payload);
    }
  }, [standardId, subjectId]);

  if (!standard || !subject) return null;

  const maxLastUpdatedAt = materials.reduce((max, material) => {
    return material.updatedAt > max ? material.updatedAt : max;
  }, '');

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
      <div>
        <div className="flex justify-end">
          <Button leftsection={<Plus weight="bold" className="w-4 h-4" />} onClick={onOpenAddModal}>
            Add <span className="hidden sm:inline">Content</span>
          </Button>
        </div>
      </div>
      {materials.length > 0 ? (
        <Accordions
          items={materials.map((material, index) => {
            return {
              title: (
                <div className="flex justify-between w-full items-center relative">
                  <div className="text-sm font-bold text-blue-primary">
                    <span className="text-color-secondary">{index + 1}.</span> {material.name}
                  </div>
                  <div className="absolute -right-4">
                    <Menu
                      menuItems={[
                        {
                          label: 'Add Material',
                          onClick: () => editMaterial(material),
                          icon: <Plus weight="bold" className="w-4 h-4" />,
                        },
                        {
                          label: 'Edit Material',
                          onClick: () => editMaterial(material),
                          icon: <Pencil weight="bold" className="w-4 h-4" />,
                        },
                        {
                          label: 'Generate Material',
                          onClick: () => generateMaterial(material),
                          icon: <UploadSimple weight="bold" className="w-4 h-4" />,
                        },
                        {
                          label: 'Delete Material',
                          onClick: () => {},
                          icon: <Trash weight="bold" className="w-4 h-4" />,
                        },
                      ]}
                      className=""
                    />
                  </div>
                </div>
              ),
              component: <StudyMaterialView material={material} />,
            };
          })}
        />
      ) : isLoadingMaterials ? (
        <Loader isLoading={isLoadingMaterials} />
      ) : (
        <BlankState label="No content found" />
      )}
      <UpsertMaterialModal isOpen={state.isOpenUpsertModal} onClose={onCloseAddModal} />
      <GenerateMaterialModal isOpen={state.isOpenGenerateModal} onClose={onCloseGenerateModal} />
    </div>
  );
});
