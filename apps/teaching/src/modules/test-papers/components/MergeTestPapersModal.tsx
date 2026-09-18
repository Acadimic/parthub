import { type TestPaperDto } from '@repo/shared/contracts';
import { RadioSelection } from '@components/app/selections';
import { Modal, ModalFooter, SoftConfirmModal, TextInput } from '@repo/ui/app';
import { MagnifyingGlassIcon } from '@phosphor-icons/react';
import { TestPaperService } from '@services';
import { useTestPaperLookups } from '@stores';
import { errorToast, reportError } from '@utils/helpers';
import { useEffect } from 'react';
import { useSetState } from 'react-use';

interface IProps {
  primaryTestPaperId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface IState {
  isLoading: boolean;
  secondaryTestPaperId: string;
  filterString: string;
  filteredPapers: TestPaperDto[];
  isConfirmModalOpen: boolean;
}

export const MergeTestPapersModal = ({ isOpen, onClose, primaryTestPaperId }: IProps) => {
  const testPaperStore = useTestPaperLookups();
  const { addTestPapers, loadTestPaperSectionsWithQuestions, getTestPaperById } = testPaperStore;
  const testPapers = testPaperStore.getTestPapers();
  const [state, setState] = useSetState<IState>({
    isLoading: false,
    secondaryTestPaperId: '',
    filterString: '',
    filteredPapers: [],
    isConfirmModalOpen: false,
  });

  const closeModal = () => {
    if (state.isLoading) return;
    setState({ secondaryTestPaperId: '', filterString: '' });
    onClose();
  };

  const openConfirmModal = () => {
    setState({ isConfirmModalOpen: true });
  };

  const onCloseConfirmModal = () => {
    setState({ isConfirmModalOpen: false });
  };

  const mergeTestPapers = async () => {
    const { secondaryTestPaperId } = state;
    if (!state.secondaryTestPaperId) {
      errorToast({ message: 'Please select a test paper to merge.' });
      return;
    }
    if (!primaryTestPaperId) return;
    try {
      setState({ isLoading: true });
      onCloseConfirmModal();
      const result = await TestPaperService.mergeTestPapers({ primaryTestPaperId, secondaryTestPaperId });
      // `callAuthApi` resolves with `{ data: undefined }` when the caller opted out of the throw, so
      // the guard is on `data` rather than on the envelope — the old check passed and pushed
      // `undefined` into the keyed map.
      if (result?.data) addTestPapers([result.data]);
      await loadTestPaperSectionsWithQuestions(primaryTestPaperId);
      setTimeout(() => closeModal(), 1000);
    } catch (error) {
      // This used to be an empty `catch {}`, so a failed merge vanished entirely.
      reportError(error, 'Could not merge the test papers.');
    } finally {
      setState({ isLoading: false });
    }
  };

  useEffect(() => {
    let papers = [];
    const { filterString } = state;
    if (filterString) {
      papers = testPapers.filter(
        (item) => item._id !== primaryTestPaperId && item.name.toLowerCase().includes(filterString.toLowerCase()),
      );
    } else {
      papers = testPapers.filter((paper) => paper._id !== primaryTestPaperId);
    }
    setState({ filteredPapers: papers });
  }, [state.filterString]);

  return (
    <>
      <Modal
        title="Merge Test Papers"
        isOpen={isOpen}
        isLoading={state.isLoading}
        onClose={closeModal}
        component={
          <div className="flex flex-col gap-2">
            <div>
              <TextInput
                placeholder="Search Test Paper"
                value={state.filterString}
                onChange={(e) => setState({ filterString: e.target.value })}
                leftsection={<MagnifyingGlassIcon className="w-5 h-5" />}
              />
            </div>
            <div>
              <RadioSelection
                label="Select Test Paper to merge"
                required
                options={state.filteredPapers.map((paper) => ({
                  label: (
                    <div className="font-medium text-sm py-2">
                      {paper.name}
                      <div className="text-xs text-muted-foreground">
                        Questions({paper.totalQuestions}), Duration({paper.durationMins} mins), Marks({paper.maxMarks}
                        ){' '}
                      </div>
                    </div>
                  ),
                  value: paper._id,
                }))}
                selectedValue={state.secondaryTestPaperId}
                handleClick={(value) => setState({ secondaryTestPaperId: value })}
                isDisabled={state.isLoading}
              />
            </div>
          </div>
        }
        footer={
          <ModalFooter
            saveText="Merge"
            cancelText="Cancel"
            onSave={openConfirmModal}
            onCancel={closeModal}
            isLoading={state.isLoading}
          />
        }
      />

      <SoftConfirmModal
        title="Confirm Merge"
        description={
          <div className="text-center">
            Are you sure you want to merge <strong>{getTestPaperById(state.secondaryTestPaperId)?.name}</strong> test
            paper?
          </div>
        }
        isOpen={state.isConfirmModalOpen}
        isLoading={state.isLoading}
        onCancel={onCloseConfirmModal}
        onConfirm={mergeTestPapers}
        confirmText="Confirm"
      />
    </>
  );
};
