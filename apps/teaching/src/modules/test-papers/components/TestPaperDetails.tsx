import { type TestPaperDto } from '@repo/shared/contracts';
import { Button, Menu, SoftConfirmModal, StatTile } from '@repo/ui/app';
import { Badge } from '@repo/ui/core';
import {
  CalendarBlankIcon,
  ClockIcon,
  GitMergeIcon,
  GraduationCapIcon,
  ListNumbersIcon,
  MedalIcon,
  PencilSimpleIcon,
  PlusIcon,
  SparkleIcon,
  StackIcon,
} from '@phosphor-icons/react';
import { TestPaperService } from '@services';
import { useStandardLookups, useTestPaperStore } from '@stores';
import { ALL } from '@utils/constants';
import { reportError, successToast } from '@utils/helpers';
import { useSetState } from 'react-use';
import { MergeTestPapersModal } from './MergeTestPapersModal';

interface IProps {
  testPaper: TestPaperDto;
  /**
   * The sections the page is showing, not `testPaper.sections.length`: a paper can keep the id of a
   * section that no longer exists (a delete interrupted between its two writes), and the header
   * must agree with the list below it rather than with the raw id list.
   */
  sectionCount: number;
  addNewSection: () => void;
  /** Opens the paper's own edit dialog, which the detail screen owns. */
  onEditPaper: () => void;
  /** Opens the AI generator for the whole paper. */
  onGenerate: () => void;
}

interface IState {
  isOpenMergeTestPapersModal: boolean;
  isOpenPublishConfirm: boolean;
  isPublishing: boolean;
}

/** Standard and subject, paper type and year: the line a teacher identifies a paper by. */
const PaperMeta = ({ testPaper }: { testPaper: TestPaperDto }) => {
  const { getStandardNamesText, getSubjectNamesText } = useStandardLookups();
  const subjects = (testPaper.subjects ?? []).filter((id) => id !== ALL);
  const subjectNames = getSubjectNamesText(subjects) || 'All subjects';

  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
        <GraduationCapIcon className="h-4 w-4 shrink-0" />
        {getStandardNamesText(testPaper.standards ?? []) || 'No standard'}
      </span>
      <span>{subjectNames}</span>
      {testPaper.paperType ? <span className="capitalize">{testPaper.paperType}</span> : null}
      {testPaper.year ? (
        <span className="inline-flex items-center gap-1.5">
          <CalendarBlankIcon className="h-4 w-4 shrink-0" />
          {testPaper.year}
        </span>
      ) : null}
    </div>
  );
};

/** Four stats in the order someone sizing up a paper asks: sections, questions, marks, minutes. */
const PaperStats = ({ testPaper, sectionCount }: { testPaper: TestPaperDto; sectionCount: number }) => {
  const questionCount = testPaper.totalQuestions ?? 0;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatTile icon={StackIcon} value={sectionCount} label={sectionCount === 1 ? 'section' : 'sections'} />
      <StatTile icon={ListNumbersIcon} value={questionCount} label={questionCount === 1 ? 'question' : 'questions'} />
      <StatTile icon={MedalIcon} value={testPaper.maxMarks ?? 0} label="marks" />
      <StatTile icon={ClockIcon} value={testPaper.durationMins ?? 0} label="minutes" />
    </div>
  );
};

/**
 * The paper's header: what it is, how big it is, and what can be done to it.
 *
 * Title and the facts a teacher identifies a paper by — standard, subject, type, year, status —
 * on the left; the two actions that matter on the right, with the rest in a menu. Below, four
 * stats in the order someone sizing up a paper asks them: how many sections, how many questions,
 * for how many marks, in how long.
 */
export const TestPaperDetails = ({ testPaper, sectionCount, addNewSection, onEditPaper, onGenerate }: IProps) => {
  const { isPublished } = testPaper;
  const addTestPapers = useTestPaperStore((state) => state.addTestPapers);
  const [state, setState] = useSetState<IState>({
    isOpenMergeTestPapersModal: false,
    isOpenPublishConfirm: false,
    isPublishing: false,
  });

  const togglePublished = async () => {
    try {
      setState({ isPublishing: true });
      const result = await TestPaperService.upsertTestPaper({ ...testPaper, isPublished: !isPublished });
      if (result?.data) addTestPapers([result.data]);
      successToast({ message: `Test paper ${isPublished ? 'unpublished' : 'published'}.` });
      setState({ isOpenPublishConfirm: false });
    } catch (error) {
      reportError(error, 'Could not change the published state.');
    } finally {
      setState({ isPublishing: false });
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {/* Wraps on a phone, where a truncated title is the only title; one line once there is room. */}
            <h1 className="break-words text-xl font-semibold text-foreground sm:truncate">{testPaper.name}</h1>
            <Badge tone={isPublished ? 'success' : 'neutral'} appearance="soft" withDot>
              {isPublished ? 'Published' : 'Draft'}
            </Badge>
          </div>
          <PaperMeta testPaper={testPaper} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            isSecondary
            text="Generate with AI"
            leftsection={<SparkleIcon className="h-4 w-4 text-primary" weight="fill" />}
            onClick={onGenerate}
          />
          <Button
            isSecondary
            text="Edit"
            leftsection={<PencilSimpleIcon className="h-4 w-4" weight="bold" />}
            onClick={onEditPaper}
          />
          <Button
            text={isPublished ? 'Unpublish' : 'Publish'}
            isSecondary={isPublished}
            onClick={() => setState({ isOpenPublishConfirm: true })}
          />
          <Menu
            menuItems={[
              {
                label: 'Add section',
                onClick: addNewSection,
                icon: <PlusIcon weight="bold" className="h-4 w-4" />,
              },
              {
                label: 'Merge another paper into this one',
                onClick: () => setState({ isOpenMergeTestPapersModal: true }),
                icon: <GitMergeIcon weight="bold" className="h-4 w-4" />,
              },
            ]}
            className="px-1"
          />
        </div>
      </div>

      <PaperStats testPaper={testPaper} sectionCount={sectionCount} />

      <MergeTestPapersModal
        primaryTestPaperId={testPaper._id}
        isOpen={state.isOpenMergeTestPapersModal}
        onClose={() => setState({ isOpenMergeTestPapersModal: false })}
      />
      <SoftConfirmModal
        title={isPublished ? 'Unpublish this paper?' : 'Publish this paper?'}
        description={
          isPublished
            ? 'Learners will no longer be able to see or attempt it.'
            : 'Learners in the paper’s standards will be able to see and attempt it.'
        }
        isOpen={state.isOpenPublishConfirm}
        isLoading={state.isPublishing}
        confirmText={isPublished ? 'Unpublish' : 'Publish'}
        onCancel={() => !state.isPublishing && setState({ isOpenPublishConfirm: false })}
        onConfirm={togglePublished}
      />
    </div>
  );
};
