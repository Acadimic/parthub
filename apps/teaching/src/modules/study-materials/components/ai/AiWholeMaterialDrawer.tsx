import { withFigureSources } from '@repo/shared/ai';
import { uploadAiFigures } from '@hooks/rich-text-media.hook';
import { type ILinkCheck, type MaterialDto } from '@repo/shared/contracts';
import { type IAiStudyMaterial } from '@repo/shared/interfaces';
import { AiDrawerFooter, AiPromptPackStep, AiSteps, type IAiStep } from '@components/app/ai';
import { Modal } from '@repo/ui/app';
import { PositionType } from '@enums';
import { CommonService, MaterialService } from '@services';
import { useMaterialLookups, useMaterialStore, useStandardLookups } from '@stores';
import { hasErrors, type IAiIssue } from '@utils/ai/common';
import {
  buildSubjectPromptPack,
  DEFAULT_MATERIAL_SETUP,
  type IAiMaterialContext,
  MATERIAL_DEFAULTS,
  mergeAiMaterialFiles,
  pairKey,
  parseAiMaterials,
  resourceUrls,
  toImportedMaterials,
  validateAiMaterials,
} from '@utils/ai/study-material-generator';
import { errorToast, getObjectId, reportError, successToast } from '@utils/helpers';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSetState } from 'react-use';
import { type LinkCheckState } from './AiMaterialImportStep';
import { type IAiImportSet, type IAiReply, AiWholeMaterialImportStep } from './AiWholeMaterialImportStep';
import { AiWholeMaterialSetup, type IWholeMaterialSetup } from './AiWholeMaterialSetup';

interface IProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'setup' | 'prompts' | 'import';
const STEPS: IAiStep<Step>[] = [
  { key: 'setup', label: 'Setup', hint: 'Standards and subjects' },
  { key: 'prompts', label: 'Prompts', hint: 'One per subject' },
  { key: 'import', label: 'Import', hint: 'Add the replies' },
];
const NEXT_STEP: Record<Step, Step> = { setup: 'prompts', prompts: 'import', import: 'import' };
const PREVIOUS_STEP: Record<Step, Step> = { setup: 'setup', prompts: 'setup', import: 'prompts' };

const INITIAL_SETUP: IWholeMaterialSetup = {
  ...DEFAULT_MATERIAL_SETUP,
  lessonCount: MATERIAL_DEFAULTS.wholeSubjectLessons,
  standards: [],
  subjects: [],
};

/** How many addresses one verify request carries; the route caps it. */
const LINK_BATCH = 60;

const countLabel = (count: number, noun: string) => `${count} ${noun}${count === 1 ? '' : 's'}`;

interface IState {
  step: Step;
  setup: IWholeMaterialSetup;
  replies: IAiReply[];
  isImporting: boolean;
  linkCheckState: LinkCheckState;
}

/** A parsed reply, kept beside its row so the merge does not parse the text again. */
interface IParsedReply {
  reply: IAiReply;
  file: IAiStudyMaterial | null;
}

/**
 * A whole standard's study material from one setup: every subject (or the chosen ones) gets its
 * own prompt and its own graded set of lessons, and the replies are imported together. Each
 * subject is a separate conversation with the model because one subject already fills a reply.
 */
export const AiWholeMaterialDrawer = ({ isOpen, onClose }: IProps) => {
  const router = useRouter();
  const standardStore = useStandardLookups();
  const materialStore = useMaterialLookups();
  const [state, setState] = useSetState<IState>({
    step: 'setup',
    setup: INITIAL_SETUP,
    replies: [],
    isImporting: false,
    linkCheckState: 'idle',
  });
  const [linkChecks, setLinkChecks] = useState<Map<string, ILinkCheck>>(new Map());
  const checkedFor = useRef('');

  useEffect(() => {
    if (!isOpen) return;
    setState({ step: 'setup', setup: INITIAL_SETUP, replies: [], linkCheckState: 'idle' });
    setLinkChecks(new Map());
    checkedFor.current = '';
    // Chapters give the prompt its ids; the list page has no reason to have loaded them.
    if (standardStore.shouldLoad('orgChapters')) standardStore.loadOrgChapters();
  }, [isOpen]);

  // Every standard-and-subject pair the setup names, in the order the standards were picked.
  const contexts: IAiMaterialContext[] = useMemo(
    () =>
      standardStore.getStandardsByIds(state.setup.standards).flatMap((standard) =>
        standardStore
          .getStandardSubjects(standard._id)
          .filter((subject) => !state.setup.subjects.length || state.setup.subjects.includes(subject._id))
          .map((subject) => ({
            standard,
            subject,
            chapters: standardStore.getStandardSubjectChapters(standard._id, subject._id),
          })),
      ),
    [state.setup.standards, state.setup.subjects, standardStore],
  );
  const contextByKey = useMemo(
    () => new Map(contexts.map((context) => [pairKey(context.standard._id, context.subject._id), context])),
    [contexts],
  );

  const packs = useMemo(() => buildSubjectPromptPack(state.setup, contexts), [state.setup, contexts]);

  /** Parses and checks one reply against the pairs this run asked for. */
  const readReply = (label: string, text: string): IParsedReply => {
    const key = getObjectId();
    const parsed = parseAiMaterials(text);
    if (!parsed.file) return { reply: { key, label, text, lessonCount: 0, issues: parsed.issues }, file: null };
    const context = contextByKey.get(pairKey(parsed.file.standard, parsed.file.subject));
    if (!context) {
      return {
        reply: {
          key,
          label,
          text,
          lessonCount: parsed.file.materials.length,
          issues: [
            ...parsed.issues,
            { level: 'error', path: 'standard', message: 'This reply is for a subject this run did not ask for.' },
          ],
        },
        file: null,
      };
    }
    const issues = [
      ...parsed.issues,
      ...validateAiMaterials(parsed.file, {
        standardId: context.standard._id,
        subjectId: context.subject._id,
        chapterIds: new Set(context.chapters.map((chapter) => chapter._id)),
        // A part may legitimately end before the exam-prep sheet.
        expectsExamPrep: state.setup.includeExamPrep && !parsed.file.part,
      }),
    ];
    return {
      reply: {
        key,
        label,
        text,
        pairTitle: `${context.standard.name} · ${context.subject.name}`,
        lessonCount: parsed.file.materials.length,
        part: parsed.file.part,
        issues,
      },
      file: hasErrors(issues) ? null : parsed.file,
    };
  };

  const parsedReplies: IParsedReply[] = useMemo(
    () => state.replies.map((reply) => ({ ...readReply(reply.label, reply.text), reply })),
    [state.replies, contextByKey],
  );

  // Clean replies, merged by subject and turned into rows; a set whose parts disagree is reported.
  const sets: IAiImportSet[] = useMemo(() => {
    const files = parsedReplies.map((item) => item.file).filter((file): file is IAiStudyMaterial => !!file);
    return mergeAiMaterialFiles(files).map((file) => {
      const key = pairKey(file.standard, file.subject);
      const context = contextByKey.get(key);
      const issues: IAiIssue[] = [];
      const refs = file.materials.map((material) => material.ref);
      if (new Set(refs).size !== refs.length) {
        issues.push({ level: 'warning', path: 'materials', message: 'Two parts share a ref; the later one was kept.' });
      }
      return {
        key,
        title: context ? `${context.standard.name} · ${context.subject.name}` : key,
        outline: file.outline ?? [],
        figures: file.figures ?? [],
        issues,
        imported: toImportedMaterials(file, {
          standard: file.standard,
          subject: file.subject,
          // The real order is settled at import, once each subject's rows are loaded.
          startOrder: 1,
          linkChecks,
        }),
        chapterName: (chapterId) => context?.chapters.find((chapter) => chapter._id === chapterId)?.name ?? '',
      };
    });
  }, [parsedReplies, contextByKey, linkChecks]);

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
      setLinkChecks(new Map());
      setState({ linkCheckState: 'failed' });
    }
  };

  // Whenever the set of clean replies changes, the addresses they cite are looked up once.
  useEffect(() => {
    const files = parsedReplies.map((item) => item.file).filter((file): file is IAiStudyMaterial => !!file);
    const urls = [...new Set(files.flatMap(resourceUrls))];
    const signature = urls.join('\n');
    if (!files.length || signature === checkedFor.current) return;
    checkedFor.current = signature;
    checkLinks(urls);
  }, [parsedReplies]);

  const addReplies = (items: { label: string; text: string }[]) =>
    setState({ replies: [...state.replies, ...items.map((item) => readReply(item.label, item.text).reply)] });
  const removeReply = (key: string) => setState({ replies: state.replies.filter((reply) => reply.key !== key) });

  const importAll = async () => {
    const ready = sets.filter((set) => set.imported.length && !hasErrors(set.issues));
    if (!ready.length || state.isImporting) return;
    setState({ isImporting: true });
    let written = 0;
    try {
      for (const set of ready) {
        const [standard, subject] = set.key.split(':');
        // Each subject's rows are loaded first so the new lessons take the orders after the last one.
        await materialStore.loadStandardSubjectMaterials({ standard, subject });
        const existing = useMaterialStore.getState().getStandardSubjectMaterials(standard, subject);
        const startOrder =
          existing.filter((row) => !row.isNew).reduce((max, row) => Math.max(max, row.order ?? 0), 0) + 1;
        const srcByRef = await uploadAiFigures(set.figures);
        const rows: MaterialDto[] = set.imported.map((item, index) => ({
          ...withFigureSources(item.dto, srcByRef),
          order: startOrder + index,
        }));
        const result = await MaterialService.bulkUpsertMaterials(rows);
        if (result?.data) materialStore.addMaterials(result.data);
        written += rows.length;
      }
      const dropped = ready.reduce((sum, set) => sum + set.imported.reduce((n, item) => n + item.dropped.length, 0), 0);
      successToast({
        message: `${countLabel(written, 'lesson')} imported across ${countLabel(ready.length, 'subject')}.`,
        description: dropped ? `${countLabel(dropped, 'unreachable reference')} left out.` : undefined,
      });
      onClose();
      await materialStore.loadMaterialStats();
      if (ready.length === 1) {
        const [standard, subject] = ready[0].key.split(':');
        router.push(`/study-materials/${standard}/${subject}`);
      }
    } catch (error) {
      reportError(
        error,
        written ? `Imported ${written} before failing; the rest were not written.` : 'Could not import the lessons.',
      );
    } finally {
      setState({ isImporting: false });
    }
  };

  const goNext = () => {
    if (state.step === 'setup' && !contexts.length) {
      errorToast({ message: 'Pick at least one standard.' });
      return;
    }
    setState({ step: NEXT_STEP[state.step] });
  };
  const goBack = () => setState({ step: PREVIOUS_STEP[state.step] });
  const stepIndex = STEPS.findIndex((step) => step.key === state.step);
  const readySets = sets.filter((set) => set.imported.length && !hasErrors(set.issues));
  const readyCount = readySets.reduce((sum, set) => sum + set.imported.length, 0);
  const isChecking = state.linkCheckState === 'checking';
  const importLabel = isChecking
    ? 'Checking references…'
    : `Import ${countLabel(readyCount, 'lesson')}${readySets.length > 1 ? ` in ${readySets.length} subjects` : ''}`;
  const plannedCount = contexts.length * (state.setup.lessonCount + (state.setup.includeExamPrep ? 1 : 0));
  const footerNote =
    state.step === 'setup' ? `${countLabel(plannedCount, 'item')} planned` : `Step ${stepIndex + 1} of ${STEPS.length}`;

  const renderStep = () => {
    if (state.step === 'setup') {
      return (
        <AiWholeMaterialSetup
          setup={state.setup}
          onChange={(fields) => setState({ setup: { ...state.setup, ...fields } })}
          standardItems={standardStore.getStandardItems()}
          subjectItems={standardStore.getStandardsSubjectItems(state.setup.standards)}
          contexts={contexts}
        />
      );
    }
    if (state.step === 'prompts') {
      return (
        <AiPromptPackStep
          packs={packs.map((pack) => ({
            key: pairKey(pack.standardId, pack.subjectId),
            title: pack.title,
            prompt: pack.prompt,
          }))}
        />
      );
    }
    return (
      <AiWholeMaterialImportStep
        replies={parsedReplies.map((item) => item.reply)}
        onAddReplies={addReplies}
        onRemoveReply={removeReply}
        sets={sets}
        linkChecks={linkChecks}
        linkCheckState={state.linkCheckState}
        onRecheckLinks={() => {
          const files = parsedReplies.map((item) => item.file).filter((file): file is IAiStudyMaterial => !!file);
          checkLinks([...new Set(files.flatMap(resourceUrls))]);
        }}
      />
    );
  };

  return (
    <Modal
      position={PositionType.RIGHT}
      className="w-full md:w-[52rem] md:max-w-[92%]"
      title="Generate a standard's study material with AI"
      description="Pick standards and subjects, run one prompt per subject in any model with web search, add the replies. Nothing is saved until you import."
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
          nextLabel={state.step === 'setup' ? 'Write the prompts' : 'I have the replies'}
          importLabel={importLabel}
          canImport={readyCount > 0 && !isChecking}
          isImporting={state.isImporting}
          onClose={onClose}
          onBack={goBack}
          onNext={goNext}
          onImport={importAll}
        />
      }
    />
  );
};
