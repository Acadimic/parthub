import { type TestPaperDto } from '@repo/shared/contracts';
import { BlankState } from '@components/others';
import { DataTable } from '@components/app/tables';
import { Badge } from '@repo/ui/core';
import { Button, Link, SoftConfirmModal, TextInput } from '@repo/ui/app';
import { useLoadOnce } from '@repo/ui/hooks';
import { PaperType } from '@enums';
import { type IColumnData, type ISelectItem } from '@interfaces';
import {
  ArrowSquareOutIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  PlusIcon,
  SparkleIcon,
  TrashIcon,
} from '@phosphor-icons/react';
import { useSelectorStore, useStandardLookups, useTestPaperStore } from '@stores';
import { ACTIONS, ALL } from '@repo/shared/utils';
import { reportError, successToast, capitalizeFirstWord } from '@utils/helpers';
import { useRouter } from 'next/router';
import { useEffect, useMemo } from 'react';
import { useSetState } from 'react-use';
import { useShallow } from 'zustand/react/shallow';
import { AiWholePaperDrawer, CreateTestPaperModal } from './components';

interface IState {
  isOpenCreateModal: boolean;
  isOpenAi: boolean;
  search: string;
  /** The paper the delete confirm is asking about, or `null` while it is closed. */
  paperToDelete: TestPaperDto | null;
  isDeleting: boolean;
}

/**
 * Whether the search term appears in the paper's derived columns — standard and subject names, the
 * year, the type — which is what someone actually hunts through, not only the name.
 */
const matchesSearch = (
  paper: TestPaperDto,
  search: string,
  standardNames: (ids: string[]) => string,
  subjectNames: (ids: string[]) => string,
) => {
  const term = search.trim().toLowerCase();
  if (!term) return true;
  return [
    paper.name,
    standardNames(paper.standards ?? []),
    subjectNames(paper.subjects ?? []),
    paper.paperType ?? '',
    paper.year ?? '',
  ]
    .join(' ')
    .toLowerCase()
    .includes(term);
};

export const TestPapers = () => {
  const router = useRouter();
  const { push } = router;
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
    isOpenAi: false,
    search: '',
    paperToDelete: null,
    isDeleting: false,
  });

  // A draft being typed into the drawer is not a row yet; it joins the list when the save lands.
  const savedTestPapers = useMemo(() => testPapers.filter((paper) => !paper.isNew), [testPapers]);

  // The search is client-side because the whole collection is already in the store; the column
  // filters — standard, subject, type, year, status — live in the table's own headers.
  const visibleTestPapers = useMemo(
    () =>
      savedTestPapers.filter((paper) => matchesSearch(paper, state.search, getStandardNamesText, getSubjectNamesText)),
    [savedTestPapers, standardStore, state.search],
  );

  const standardOptions: ISelectItem[] = standardStore
    .getStandards()
    .map((standard) => ({ label: standard.name, value: standard._id }));
  const subjectOptions: ISelectItem[] = standardStore.getStandardsSubjectItems(
    standardOptions.map((option) => option.value),
  );
  /** A paper with no subjects, or the ALL marker, covers every subject of its standards, so it matches any of them. */
  const paperSubjectIds = (paper: TestPaperDto) => {
    const subjects = (paper.subjects ?? []).filter((id) => id !== ALL);
    if (subjects.length) return subjects;
    return standardStore.getStandardsSubjectItems(paper.standards ?? []).map((item) => item.value);
  };

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

  // `?add=true` arrives from the home page's quick actions: open the create drawer once, then drop
  // the flag from the address so a refresh or a back navigation does not reopen it.
  useEffect(() => {
    if (router.query.add !== 'true') return;
    onOpenCreateModal();
    router.replace(router.pathname, undefined, { shallow: true });
  }, [router.query.add]);

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

  /** The second line under a paper's name: its standards and subjects, which used to be two columns. */
  const describeScope = (row: TestPaperDto) => {
    const standards = getStandardNamesText(row.standards ?? []) || 'No standard';
    const subjects = getSubjectNamesText((row.subjects ?? []).filter((id) => id !== ALL)) || 'All subjects';
    return `${standards} · ${subjects}`;
  };

  const columns: IColumnData<TestPaperDto>[] = [
    {
      label: 'Paper',
      dataKey: 'name',
      width: 260,
      isSortable: true,
      filters: [
        { key: 'standard', label: 'Standard', options: standardOptions, getValues: (row) => row.standards ?? [] },
        { key: 'subject', label: 'Subject', options: subjectOptions, getValues: paperSubjectIds },
      ],
      component: (row) => (
        <div className="flex min-w-0 flex-col">
          <Link
            href={`/test-papers/${row._id}`}
            isSubtle
            className="h-auto justify-start px-0 py-0 text-left"
            // The row is a target too, so the link stops the event rather than navigating twice.
            onClick={(event) => {
              event.stopPropagation();
              selectTestPaper(row);
            }}
          >
            <span className="truncate font-semibold text-foreground">{row.name}</span>
          </Link>
          <span className="truncate text-xs text-muted-foreground">{describeScope(row)}</span>
        </div>
      ),
    },
    {
      label: 'Type',
      dataKey: 'paperType',
      width: 125,
      isSortable: true,
      filters: [
        {
          key: 'type',
          label: 'Type',
          options: Object.values(PaperType).map((type) => ({ label: capitalizeFirstWord(type), value: type })),
          getValues: (row) => row.paperType,
        },
      ],
      // The stored values are lowercase enum members ('previous year'), which read as a typo in a
      // column of otherwise capitalised text.
      valueFormatter: (row) =>
        row.paperType ? (
          <Badge tone="neutral" appearance="soft" className="capitalize">
            {row.paperType}
          </Badge>
        ) : (
          ''
        ),
    },
    {
      label: 'Year',
      dataKey: 'year',
      width: 100,
      isSortable: true,
      filters: [{ key: 'year', label: 'Year', getValues: (row) => row.year }],
    },
    {
      label: 'Sections',
      dataKey: 'sections',
      width: 115,
      align: 'right',
      sortValue: (row) => (row.sections ?? []).length,
      valueFormatter: (row) => <span className="font-mono">{(row.sections ?? []).length}</span>,
    },
    {
      label: 'Questions',
      dataKey: 'totalQuestions',
      width: 125,
      align: 'right',
      sortValue: (row) => row.totalQuestions ?? 0,
      valueFormatter: (row) => <span className="font-mono">{row.totalQuestions ?? 0}</span>,
    },
    {
      label: 'Marks',
      dataKey: 'maxMarks',
      width: 100,
      align: 'right',
      sortValue: (row) => row.maxMarks ?? 0,
      valueFormatter: (row) => <span className="font-mono">{row.maxMarks ?? 0}</span>,
    },
    {
      label: 'Duration',
      dataKey: 'durationMins',
      width: 120,
      align: 'right',
      sortValue: (row) => row.durationMins ?? 0,
      valueFormatter: (row) => (row.durationMins ? <span className="font-mono">{row.durationMins} min</span> : ''),
    },
    {
      label: 'Status',
      dataKey: 'isPublished',
      width: 125,
      sortValue: (row) => (row.isPublished ? 1 : 0),
      filters: [
        {
          key: 'status',
          label: 'Status',
          options: [
            { label: 'Published', value: 'published' },
            { label: 'Draft', value: 'draft' },
          ],
          getValues: (row) => (row.isPublished ? 'published' : 'draft'),
        },
      ],
      valueFormatter: (row) => (
        <Badge tone={row.isPublished ? 'success' : 'neutral'} appearance="soft" withDot>
          {row.isPublished ? 'Published' : 'Draft'}
        </Badge>
      ),
    },
    {
      label: 'Actions',
      dataKey: ACTIONS,
      width: 90,
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
          label: 'Delete',
          onClick: (row) => row && setState({ paperToDelete: row }),
          icon: <TrashIcon weight="bold" className="w-4 h-4" />,
        },
      ],
    },
  ];

  const renderEmptyState = () =>
    state.search.trim() ? (
      <BlankState
        label="No matching test papers"
        description="Try a different name, standard, subject or year."
        action={<Button isSecondary text="Clear search" onClick={() => setState({ search: '' })} />}
      />
    ) : (
      <BlankState
        label="No test papers yet"
        description="Create your first test paper by hand, or let a model draft a whole paper from a standard."
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Button leftsection={<PlusIcon weight="bold" className="w-4 h-4" />} onClick={onOpenCreateModal}>
              Create test paper
            </Button>
            <Button
              isSecondary
              leftsection={<SparkleIcon weight="bold" className="w-4 h-4" />}
              onClick={() => setState({ isOpenAi: true })}
            >
              Generate with AI
            </Button>
          </div>
        }
      />
    );

  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-full sm:w-72">
            <TextInput
              placeholder="Search papers"
              value={state.search}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => setState({ search: event.target.value })}
              leftsection={<MagnifyingGlassIcon weight="bold" className="h-4 w-4" />}
              aria-label="Search papers"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {savedTestPapers.length} {savedTestPapers.length === 1 ? 'paper' : 'papers'}
            <span className="hidden md:inline">
              {' '}
              · Filter by standard, type, year or status from the column headers.
            </span>
          </p>
          <div className="ml-auto flex items-center gap-2">
            <Button
              isSecondary
              leftsection={<SparkleIcon weight="fill" className="h-4 w-4 text-primary" />}
              onClick={() => setState({ isOpenAi: true })}
            >
              Generate <span className="hidden sm:inline">with AI</span>
            </Button>
            <Button leftsection={<PlusIcon weight="bold" className="h-4 w-4" />} onClick={onOpenCreateModal}>
              Create <span className="hidden sm:inline">test paper</span>
            </Button>
          </div>
        </div>
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

      {/* Mounted only while the dialog is open. It used to be mounted whenever *any* paper was
          selected, so its auto-name effect renamed whichever paper had last been clicked. */}
      {state.isOpenCreateModal && <CreateTestPaperModal isOpen onClose={onCloseCreateModal} />}
      <AiWholePaperDrawer isOpen={state.isOpenAi} onClose={() => setState({ isOpenAi: false })} />

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
