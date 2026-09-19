import { type ILinkCheck, type MaterialDto } from '@repo/shared/contracts';
import { AiDrawerFooter, AiPromptStep, AiSteps, type IAiStep } from '@components/app/ai';
import { Modal } from '@repo/ui/app';
import { PositionType } from '@enums';
import { type ISelectItem } from '@interfaces';
import { CommonService, MaterialService } from '@services';
import { useMaterialLookups, useStandardLookups } from '@stores';
import { hasErrors, type IAiIssue } from '@utils/ai/common';
import {
  buildStudyMaterialPrompt,
  DEFAULT_MATERIAL_SETUP,
  type IAiMaterialContext,
  type IAiMaterialSetup,
  type IImportedMaterial,
  parseAiMaterials,
  resourceUrls,
  toImportedMaterials,
  validateAiMaterials,
} from '@utils/ai/study-material-generator';
import { errorToast, reportError, successToast } from '@utils/helpers';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSetState } from 'react-use';
import { AiMaterialImportStep, type LinkCheckState } from './AiMaterialImportStep';
import { AiMaterialSetup } from './AiMaterialSetup';

interface IProps {
  isOpen: boolean;
  onClose: () => void;
  standardId: string;
  subjectId: string;
}

type Step = 'setup' | 'prompt' | 'import';
const STEPS: IAiStep<Step>[] = [
  { key: 'setup', label: 'Setup', hint: 'Scope and size' },
  { key: 'prompt', label: 'Prompt', hint: 'Copy to a model' },
  { key: 'import', label: 'Import', hint: 'Paste the JSON' },
];

/** The `order` after the page's last saved row, so imported lessons land at the end. */
const nextOrder = (rows: MaterialDto[]): number =>
  rows.filter((row) => !row.isNew).reduce((max, row) => Math.max(max, row.order ?? 0), 0) + 1;

const countLabel = (count: number, noun: string) => `${count} ${noun}${count === 1 ? '' : 's'}`;

const NEXT_STEP: Record<Step, Step> = { setup: 'prompt', prompt: 'import', import: 'import' };
const PREVIOUS_STEP: Record<Step, Step> = { setup: 'setup', prompt: 'setup', import: 'prompt' };

/** How many addresses one verify request carries; the route caps it. */
const LINK_BATCH = 60;

interface IState {
  step: Step;
  setup: IAiMaterialSetup;
  jsonText: string;
  isImporting: boolean;
  linkCheckState: LinkCheckState;
}

/**
 * A graded set of lessons for a subject, from any model, in three steps: say what to teach, copy
 * the prompt the drawer writes, paste the JSON that comes back. The reply is checked against the
 * workspace, every cited address is looked up, and nothing is saved until the import.
 */
export const AiMaterialDrawer = ({ isOpen, onClose, standardId, subjectId }: IProps) => {
  const standardStore = useStandardLookups();
  const materialStore = useMaterialLookups();
  const [state, setState] = useSetState<IState>({
    step: 'setup',
    setup: DEFAULT_MATERIAL_SETUP,
    jsonText: '',
    isImporting: false,
    linkCheckState: 'idle',
  });
  const [issues, setIssues] = useState<IAiIssue[]>([]);
  const [linkChecks, setLinkChecks] = useState<Map<string, ILinkCheck>>(new Map());
  // The addresses the last check was for, so an unchanged reply is not looked up twice.
  const checkedFor = useRef('');

  useEffect(() => {
    if (!isOpen) return;
    setState({ step: 'setup', setup: DEFAULT_MATERIAL_SETUP, jsonText: '', linkCheckState: 'idle' });
    setIssues([]);
    setLinkChecks(new Map());
    checkedFor.current = '';
  }, [isOpen, standardId, subjectId]);

  const context: IAiMaterialContext | null = useMemo(() => {
    const standard = standardStore.getStandardById(standardId);
    const subject = standardStore.getSubjectById(subjectId);
    if (!standard || !subject) return null;
    return { standard, subject, chapters: standardStore.getStandardSubjectChapters(standardId, subjectId) };
  }, [standardId, subjectId, standardStore]);

  const chapterItems: ISelectItem[] = useMemo(
    () => (context?.chapters ?? []).map((chapter) => ({ label: chapter.name, value: chapter._id })),
    [context],
  );
  const chapterName = (chapterId?: string) =>
    (context?.chapters ?? []).find((chapter) => chapter._id === chapterId)?.name ?? '';

  const prompt = useMemo(() => (context ? buildStudyMaterialPrompt(state.setup, context) : ''), [state.setup, context]);

  // Re-derived from the text and the link results, so a finished check reshapes the preview
  // without a second parse being stored anywhere.
  const parsed = useMemo(() => parseAiMaterials(state.jsonText), [state.jsonText]);
  const imported: IImportedMaterial[] = useMemo(() => {
    if (!parsed.file || !context || hasErrors(issues)) return [];
    return toImportedMaterials(parsed.file, {
      standard: standardId,
      subject: subjectId,
      startOrder: nextOrder(materialStore.getStandardSubjectMaterials(standardId, subjectId)),
      linkChecks,
    });
  }, [parsed, issues, linkChecks, context, standardId, subjectId]);

  const checkLinks = async (urls: string[]) => {
    if (!urls.length) {
      setState({ linkCheckState: 'done' });
      return;
    }
    setState({ linkCheckState: 'checking' });
    try {
      const results = new Map<string, ILinkCheck>();
      for (let index = 0; index < urls.length; index += LINK_BATCH) {
        const { data } = await CommonService.verifyLinks(urls.slice(index, index + LINK_BATCH));
        (data ?? []).forEach((check) => results.set(check.url, check));
      }
      setLinkChecks(results);
      setState({ linkCheckState: 'done' });
    } catch {
      // Already toasted by the HTTP layer. Unchecked references are kept, and the step says so.
      setLinkChecks(new Map());
      setState({ linkCheckState: 'failed' });
    }
  };

  const checkJson = (text: string) => {
    setState({ jsonText: text });
    const result = parseAiMaterials(text);
    if (!result.file || !context) {
      setIssues(result.issues);
      return;
    }
    const all = [
      ...result.issues,
      ...validateAiMaterials(result.file, {
        standardId,
        subjectId,
        chapterIds: new Set(context.chapters.map((chapter) => chapter._id)),
        expectsExamPrep: state.setup.includeExamPrep,
      }),
    ];
    setIssues(all);
    if (hasErrors(all)) return;
    // The same set of addresses is checked once, however the text around them is edited.
    const urls = resourceUrls(result.file);
    const signature = urls.join('\n');
    if (signature === checkedFor.current) return;
    checkedFor.current = signature;
    checkLinks(urls);
  };

  const recheckLinks = () => {
    if (!parsed.file) return;
    checkLinks(resourceUrls(parsed.file));
  };

  const importMaterials = async () => {
    if (!imported.length || state.isImporting) return;
    setState({ isImporting: true });
    try {
      const rows: MaterialDto[] = imported.map((item) => item.dto);
      const result = await MaterialService.bulkUpsertMaterials(rows);
      if (result?.data) materialStore.addMaterials(result.data);
      const dropped = imported.reduce((sum, item) => sum + item.dropped.length, 0);
      successToast({
        message: `${countLabel(rows.length, 'lesson')} imported.`,
        description: dropped ? `${countLabel(dropped, 'unreachable reference')} left out.` : undefined,
      });
      onClose();
      await materialStore.loadStandardSubjectMaterials({ standard: standardId, subject: subjectId });
    } catch (error) {
      reportError(error, 'Could not import the lessons.');
    } finally {
      setState({ isImporting: false });
    }
  };

  const goNext = () => {
    if (state.step === 'setup' && !context) {
      errorToast({ message: 'The standard and subject are still loading.' });
      return;
    }
    setState({ step: NEXT_STEP[state.step] });
  };
  const goBack = () => setState({ step: PREVIOUS_STEP[state.step] });
  const stepIndex = STEPS.findIndex((step) => step.key === state.step);
  const plannedCount = state.setup.lessonCount + (state.setup.includeExamPrep ? 1 : 0);
  const isChecking = state.linkCheckState === 'checking';
  const importLabel = isChecking ? 'Checking references…' : `Import ${countLabel(imported.length, 'lesson')}`;
  const footerNote =
    state.step === 'setup' ? `${countLabel(plannedCount, 'item')} planned` : `Step ${stepIndex + 1} of ${STEPS.length}`;

  const renderStep = () => {
    if (state.step === 'setup') {
      return (
        <AiMaterialSetup
          setup={state.setup}
          onChange={(fields) => setState({ setup: { ...state.setup, ...fields } })}
          chapterItems={chapterItems}
          standardName={context?.standard.name ?? ''}
          subjectName={context?.subject.name ?? ''}
        />
      );
    }
    if (state.step === 'prompt') {
      return (
        <AiPromptStep prompt={prompt} fileName={`${context?.subject.name ?? 'lessons'} lessons`} subject="lessons" />
      );
    }
    return (
      <AiMaterialImportStep
        text={state.jsonText}
        onChangeText={checkJson}
        issues={issues}
        imported={imported}
        linkChecks={linkChecks}
        linkCheckState={state.linkCheckState}
        onRecheckLinks={recheckLinks}
        chapterName={chapterName}
      />
    );
  };

  return (
    <Modal
      position={PositionType.RIGHT}
      className="w-full md:w-[52rem] md:max-w-[92%]"
      title="Generate lessons with AI"
      description="Say what to teach, copy the prompt into any model with web search, paste its JSON back. Nothing is saved until you import."
      isOpen={isOpen}
      onClose={() => !state.isImporting && onClose()}
      component={
        <div className="flex flex-col gap-6">
          <AiSteps steps={STEPS} current={state.step} onSelect={(step) => setState({ step })} />
          {renderStep()}
        </div>
      }
      footer={
        <AiDrawerFooter
          note={footerNote}
          isFirstStep={stepIndex === 0}
          isLastStep={state.step === 'import'}
          nextLabel={state.step === 'setup' ? 'Write the prompt' : 'I have the JSON'}
          importLabel={importLabel}
          canImport={imported.length > 0 && !hasErrors(issues) && !isChecking}
          isImporting={state.isImporting}
          onClose={onClose}
          onBack={goBack}
          onNext={goNext}
          onImport={importMaterials}
        />
      }
    />
  );
};
