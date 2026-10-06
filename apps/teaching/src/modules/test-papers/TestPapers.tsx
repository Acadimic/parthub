import { type TestPaperDto } from '@repo/shared/contracts';
import { BlankState } from '@components/others';
import { DataTable } from '@components/app/tables';
import { Badge } from '@repo/ui/core';
import { Button, SoftConfirmModal, TextInput } from '@repo/ui/app';
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
import { AiWholePaperDrawer, CreateTestPaperModal, PaperGroupCard } from './components';

interface IState {
  isOpenCreateModal: boolean;
  isOpenAi: boolean;
  search: string;
  /** The paper the delete confirm is asking about, or `null` while it is closed. */
  paperToDelete: TestPaperDto | null;
  isDeleting: boolean;
  /** Standard groups the teacher has opened, by group key. Every group starts folded. */
  expandedGroups: string[];
}

/** The papers filed under one standard, or under none. */
interface IPaperGroup {
  key: string;
  label: string;
  papers: TestPaperDto[];
}

/** The group for papers with no standard, or only standards that no longer exist. */
const NO_STANDARD_GROUP = 'no-standard';

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
    expandedGroups: [],
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

  // One group per standard, in the standards' own order, with papers that have none last. A paper
  // filed under two standards is listed in both, since a teacher looks for it under either.
  const paperGroups = useMemo((): IPaperGroup[] => {
    const papersByStandard = new Map<string, TestPaperDto[]>();
    for (const paper of visibleTestPapers) {
      const standardIds = (paper.standards ?? []).filter((id) => standardStore.getStandardById(id));
      for (const key of standardIds.length ? standardIds : [NO_STANDARD_GROUP]) {
        papersByStandard.set(key, [...(papersByStandard.get(key) ?? []), paper]);
      }
    }
    const groups = standardStore
      .getStandards()
      .filter((standard) => papersByStandard.has(standard._id))
      .map((standard) => ({
        key: standard._id,
        label: standard.name,
        papers: papersByStandard.get(standard._id) ?? [],
      }));
    const unfiled = papersByStandard.get(NO_STANDARD_GROUP);
    return unfiled ? [...groups, { key: NO_STANDARD_GROUP, label: 'No standard', papers: unfiled }] : groups;
  }, [visibleTestPapers, standardStore]);

  const toggleGroup = (key: string) =>
    setState((current) => ({
      expandedGroups: current.expandedGroups.includes(key)
        ? current.expandedGroups.filter((item) => item !== key)
        : [...current.expandedGroups, key],
    }));

  const subjectOptions: ISelectItem[] = standardStore.getStandardsSubjectItems(
    standardStore.getStandards().map((standard) => standard._id),
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

  /** The second line under a paper's name: its subjects. The standard is the group it sits in. */
  const describeSubjects = (row: TestPaperDto) =>
    getSubjectNamesText((row.subjects ?? []).filter((id) => id !== ALL)) || 'All subjects';

  const columns: IColumnData<TestPaperDto>[] = [
    {
      label: 'Paper',
      dataKey: 'name',
      width: 260,
      isSortable: true,
      filters: [{ key: 'subject', label: 'Subject', options: subjectOptions, getValues: paperSubjectIds }],
      // Plain text, as on the courses table: the row is the target. A `Link` here centred the name
      // and clipped it at both ends, since the link lays its content out as a centred button.
      component: (row) => (
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-semibold text-foreground" title={row.name}>
            {row.name}
          </span>
          <span className="truncate text-xs text-muted-foreground">{describeSubjects(row)}</span>
        </div>
      ),
    },
    {
      label: 'Type',
      dataKey: 'paperType',
      width: 105,
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
      width: 95,
      isSortable: true,
      filters: [{ key: 'year', label: 'Year', getValues: (row) => row.year }],
    },
    {
      label: 'Sections',
      dataKey: 'sections',
      width: 110,
      align: 'right',
      sortValue: (row) => (row.sections ?? []).length,
      valueFormatter: (row) => <span className="font-mono">{(row.sections ?? []).length}</span>,
    },
    {
      label: 'Questions',
      dataKey: 'totalQuestions',
      width: 120,
      align: 'right',
      sortValue: (row) => row.totalQuestions ?? 0,
      valueFormatter: (row) => <span className="font-mono">{row.totalQuestions ?? 0}</span>,
    },
    {
      label: 'Marks',
      dataKey: 'maxMarks',
      width: 85,
      align: 'right',
      sortValue: (row) => row.maxMarks ?? 0,
      valueFormatter: (row) => <span className="font-mono">{row.maxMarks ?? 0}</span>,
    },
    {
      label: 'Duration',
      dataKey: 'durationMins',
      width: 105,
      align: 'right',
      sortValue: (row) => row.durationMins ?? 0,
      valueFormatter: (row) => (row.durationMins ? <span className="font-mono">{row.durationMins} min</span> : ''),
    },
    {
      label: 'Status',
      dataKey: 'isPublished',
      width: 115,
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
      width: 80,
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

  const renderPapers = () => {
    if (isFailed) {
      return (
        <BlankState
          label="Could not load test papers"
          description={error}
          action={<Button text="Retry" onClick={() => loadTestPapers()} />}
          className="rounded-lg border border-border"
        />
      );
    }
    if (isLoading || !paperGroups.length) {
      return <DataTable rows={[]} columns={columns} isLoading={isLoading} emptyState={renderEmptyState()} />;
    }
    return (
      <div className="flex min-w-0 flex-col gap-3">
        {paperGroups.map((group) => (
          <PaperGroupCard
            key={group.key}
            label={group.label}
            papers={group.papers}
            columns={columns}
            // A search opens every group it matches, so the results show without a click each.
            isOpen={!!state.search.trim() || state.expandedGroups.includes(group.key)}
            onToggle={() => toggleGroup(group.key)}
            onOpenPaper={onClickTestPaper}
          />
        ))}
      </div>
    );
  };

  return (
    <>
      <div className="flex min-w-0 flex-col gap-3">
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
            {paperGroups.length
              ? ` in ${paperGroups.length} ${paperGroups.length === 1 ? 'standard' : 'standards'}`
              : ''}
            <span className="hidden xl:inline"> · Filter a group from its column headers.</span>
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
        {renderPapers()}
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
