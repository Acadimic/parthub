import { type TestPaperDto } from '@repo/shared/contracts';
import { BlankState } from '@components/others';
import { DataTable } from '@components/app/tables';
import { Badge } from '@repo/ui/core';
import { Button, Link, SoftConfirmModal, TextInput } from '@repo/ui/app';
import { useLoadOnce } from '@repo/ui/hooks';
import { type IColumnData } from '@interfaces';
import { ArrowSquareOutIcon, MagnifyingGlassIcon, PencilIcon, PlusIcon, TrashIcon } from '@phosphor-icons/react';
import { useSelectorStore, useStandardLookups, useTestPaperStore } from '@stores';
import { ACTIONS } from '@utils/constants';
import { reportError, successToast } from '@utils/helpers';
import { useRouter } from 'next/router';
import { useMemo } from 'react';
import { useSetState } from 'react-use';
import { useShallow } from 'zustand/react/shallow';
import { CreateTestPaperModal } from './components';

interface IState {
  isOpenCreateModal: boolean;
  search: string;
  /** The paper the delete confirm is asking about, or `null` while it is closed. */
  paperToDelete: TestPaperDto | null;
  isDeleting: boolean;
}

export const TestPapers = () => {
  const { push } = useRouter();
  const setSelectedTestPaperId = useSelectorStore((state) => state.setSelectedTestPaperId);
  const setSelectedTestPaperSectionId = useSelectorStore((state) => state.setSelectedTestPaperSectionId);
  // `getTestPapers` builds a new array on every call, so the result needs a shallow compare.
  const testPapers = useTestPaperStore(useShallow((state) => state.getTestPapers()));
  const createTestPaper = useTestPaperStore((state) => state.createTestPaper);
  const deleteTestPaper = useTestPaperStore((state) => state.deleteTestPaper);
  const loadTestPapers = useTestPaperStore((state) => state.loadTestPapers);
  const { isLoading, isFailed, error } = useLoadOnce(useTestPaperStore, 'testPapers', (state) => state.loadTestPapers);
  // The whole standard store, because the two name lookups below read its maps: a bare method
  // reference is stable, so without this subscription the columns would still be blank after the
  // reference data lands.
  const standardStore = useStandardLookups();
  const { getStandardNamesText, getSubjectNamesText } = standardStore;
  const [state, setState] = useSetState<IState>({
    isOpenCreateModal: false,
    search: '',
    paperToDelete: null,
    isDeleting: false,
  });

  // Filtering is client-side because the whole collection is already in the store, and it covers
  // the derived columns — standard and subject names, the year, the type — which is what someone
  // actually hunts through. The search box used to render with no handler at all.
  const visibleTestPapers = useMemo(() => {
    // A draft being typed into the drawer is not a row yet; it joins the list when the save lands.
    const saved = testPapers.filter((paper) => !paper.isNew);
    const term = state.search.trim().toLowerCase();
    if (!term) return saved;
    return saved.filter((paper) =>
      [
        paper.name,
        getStandardNamesText(paper.standards ?? []),
        getSubjectNamesText(paper.subjects ?? []),
        paper.paperType ?? '',
        paper.year ?? '',
      ]
        .join(' ')
        .toLowerCase()
        .includes(term),
    );
  }, [testPapers, standardStore, state.search]);

  /** Selects a paper and its first section, which is what the detail screen opens on. */
  const selectTestPaper = (testPaper: TestPaperDto) => {
    setSelectedTestPaperId(testPaper._id);
    setSelectedTestPaperSectionId((testPaper.sections ?? [])[0] ?? '');
  };

  const onOpenCreateModal = () => {
    // Selected as well as created: the modal renders from `useSelectedTestPaper()` and returned
    // null without one, so the button left a blank row in the table and opened nothing.
    setSelectedTestPaperId(createTestPaper()._id);
    setState({ isOpenCreateModal: true });
  };

  const onOpenEditModal = (testPaper: TestPaperDto) => {
    setSelectedTestPaperId(testPaper._id);
    setState({ isOpenCreateModal: true });
  };

  const onCloseCreateModal = () => {
    setState({ isOpenCreateModal: false });
  };

  const onClickTestPaper = (testPaper: TestPaperDto) => {
    selectTestPaper(testPaper);
    push(
      { pathname: `/test-papers/${testPaper._id}`, query: { name: testPaper.name } },
      `/test-papers/${testPaper._id}`,
    );
  };

  const onConfirmDelete = async () => {
    const paper = state.paperToDelete;
    if (!paper) return;
    try {
      setState({ isDeleting: true });
      await deleteTestPaper(paper._id);
      successToast({ message: 'Test paper deleted successfully.' });
      setState({ paperToDelete: null });
    } catch (error) {
      reportError(error, 'Could not delete the test paper.');
    } finally {
      setState({ isDeleting: false });
    }
  };

  const columns: IColumnData<TestPaperDto>[] = [
    {
      label: 'Name',
      dataKey: 'name',
      width: 260,
      component: (row) => (
        <Link
          href={`/test-papers/${row._id}`}
          isSubtle
          className="px-0 text-left"
          // The row is a target too, so the link stops the event rather than navigating twice.
          onClick={(event) => {
            event.stopPropagation();
            selectTestPaper(row);
          }}
        >
          <span className="truncate text-primary">{row.name}</span>
        </Link>
      ),
    },
    {
      label: 'Standards',
      dataKey: 'standards',
      valueFormatter: (row) => getStandardNamesText(row.standards ?? []),
    },
    {
      label: 'Subjects',
      dataKey: 'subjects',
      // No subjects means the paper covers every subject in its standards, which is what the
      // create form stores as an empty list.
      valueFormatter: (row) => getSubjectNamesText(row.subjects ?? []) || 'All',
    },
    {
      label: 'Type',
      dataKey: 'paperType',
      width: 140,
      // The stored values are lowercase enum members ('previous year'), which read as a typo in a
      // column of otherwise capitalised text.
      valueFormatter: (row) => (row.paperType ? <span className="capitalize">{row.paperType}</span> : ''),
    },
    {
      label: 'Year',
      dataKey: 'year',
      width: 90,
    },
    {
      label: 'Sections',
      dataKey: 'sections',
      width: 100,
      valueFormatter: (row) => <span className="font-mono">{(row.sections ?? []).length}</span>,
    },
    {
      label: 'Questions',
      dataKey: 'totalQuestions',
      width: 110,
      valueFormatter: (row) => <span className="font-mono">{row.totalQuestions ?? 0}</span>,
    },
    {
      label: 'Marks',
      dataKey: 'maxMarks',
      width: 90,
      valueFormatter: (row) => <span className="font-mono">{row.maxMarks ?? 0}</span>,
    },
    {
      label: 'Duration',
      dataKey: 'durationMins',
      width: 110,
      valueFormatter: (row) => (row.durationMins ? `${row.durationMins} mins` : ''),
    },
    {
      label: 'Published',
      dataKey: 'isPublished',
      width: 120,
      valueFormatter: (row) =>
        row.isPublished ? <Badge tone="success">Published</Badge> : <Badge tone="neutral">Draft</Badge>,
    },
    {
      label: 'Actions',
      dataKey: ACTIONS,
      width: 96,
      menuItems: [
        {
          label: 'Open',
          onClick: (row) => row && onClickTestPaper(row),
          icon: <ArrowSquareOutIcon weight="bold" className="w-4 h-4" />,
        },
        {
          label: 'Edit Details',
          onClick: (row) => row && onOpenEditModal(row),
          icon: <PencilIcon weight="bold" className="w-4 h-4" />,
        },
        {
          // Was `onClick: () => {}` — the item opened nothing and deleted nothing.
          label: 'Delete',
          onClick: (row) => row && setState({ paperToDelete: row }),
          icon: <TrashIcon weight="bold" className="w-4 h-4" />,
        },
      ],
    },
  ];

  const renderEmptyState = () =>
    state.search ? (
      <BlankState label="No matching test papers" description="Try a different name, standard, subject or year." />
    ) : (
      <BlankState
        label="No test papers yet"
        description="Create your first test paper, then add its sections and questions."
        action={
          <Button leftsection={<PlusIcon weight="bold" className="w-4 h-4" />} onClick={onOpenCreateModal}>
            Create Test Paper
          </Button>
        }
      />
    );

  return (
    <>
      <div>
        <div className="flex justify-between items-center">
          <div>
            <TextInput
              placeholder="Search Test Paper"
              value={state.search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setState({ search: e.target.value })}
              leftsection={<MagnifyingGlassIcon weight="bold" className="w-4 h-4" />}
            />
          </div>
          <div>
            <Button leftsection={<PlusIcon weight="bold" className="w-4 h-4" />} onClick={onOpenCreateModal}>
              Create <span className="hidden sm:inline">Test Paper</span>
            </Button>
          </div>
        </div>
        <div className="mt-4">
          {isFailed ? (
            <BlankState
              label="Could not load test papers"
              description={error}
              action={<Button text="Retry" onClick={() => loadTestPapers()} />}
              className="rounded-lg border border-border"
            />
          ) : (
            <DataTable
              rows={visibleTestPapers}
              columns={columns}
              isLoading={isLoading}
              onRowClick={onClickTestPaper}
              emptyState={renderEmptyState()}
            />
          )}
        </div>
      </div>

      {/* Mounted only while the dialog is open. It used to be mounted whenever *any* paper was
          selected, so its auto-name effect renamed whichever paper had last been clicked. */}
      {state.isOpenCreateModal && <CreateTestPaperModal isOpen onClose={onCloseCreateModal} />}

      <SoftConfirmModal
        title="Delete Test Paper"
        description={
          <div>
            Delete <strong>{state.paperToDelete?.name}</strong>? Its sections and questions go with it, and learners
            lose access.
          </div>
        }
        isOpen={!!state.paperToDelete}
        isLoading={state.isDeleting}
        isDestructive
        confirmText="Delete"
        onCancel={() => !state.isDeleting && setState({ paperToDelete: null })}
        onConfirm={onConfirmDelete}
      />
    </>
  );
};
