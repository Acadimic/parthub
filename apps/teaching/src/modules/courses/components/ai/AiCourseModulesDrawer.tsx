import { figuresOf, withFigureSources } from '@repo/shared/ai';
import { uploadAiFigures } from '@hooks/rich-text-media.hook';
import { type CourseDto, type CourseModuleDto, type MaterialDto } from '@repo/shared/contracts';
import { AiDrawerFooter, AiIssueList, AiPromptPackStep, AiSteps, type IAiStep } from '@components/app/ai';
import {
  BookOpenTextIcon,
  CheckCircleIcon,
  FileTextIcon,
  PlusIcon,
  TrashIcon,
  UploadSimpleIcon,
  WarningCircleIcon,
  XCircleIcon,
} from '@phosphor-icons/react';
import { Button, DrawerSection, Modal, TextArea } from '@repo/ui/app';
import { Badge } from '@repo/ui/core';
import { PositionType } from '@enums';
import { createPaperFromImport } from '@modules/test-papers/components/ai';
import { CourseService, MaterialService } from '@services';
import { useCourseLookups, useMaterialLookups, useStandardLookups } from '@stores';
import { hasErrors } from '@utils/ai/common';
import {
  buildCoursePrompts,
  type IContentReply,
  type ICourseModuleContext,
  type ILessonReply,
  type IQuizReply,
  readContentReply,
} from '@utils/ai/course-modules';
import { getObjectId, reportError, successToast } from '@utils/helpers';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSetState } from 'react-use';
import { persistCourseStats } from './course-stats';

interface IProps {
  isOpen: boolean;
  onClose: () => void;
  course: CourseDto;
  modules: CourseModuleDto[];
}

type Step = 'prompts' | 'import';
const STEPS: IAiStep<Step>[] = [
  { key: 'prompts', label: 'Prompts', hint: 'One per day, one per quiz' },
  { key: 'import', label: 'Import', hint: 'Add the replies' },
];

interface IReply {
  key: string;
  label: string;
  text: string;
}

interface IState {
  step: Step;
  replies: IReply[];
  isImporting: boolean;
}

const countLabel = (count: number, noun: string) => `${count} ${noun}${count === 1 ? '' : 's'}`;

const KIND_LABEL: Record<IContentReply['kind'], string> = { lessons: 'Lessons · ', quiz: 'Quiz · ', unknown: '' };

const replyWhat = (result: IContentReply): string => {
  if (result.kind === 'lessons') return countLabel(result.imported.length, 'lesson');
  if (result.kind === 'quiz') return countLabel(result.imported.length, 'question');
  return 'not readable';
};

const ReplyMark = ({ errors, warnings }: { errors: number; warnings: number }) => {
  if (errors) return <XCircleIcon weight="fill" className="h-4 w-4 shrink-0 text-destructive" />;
  if (warnings) return <WarningCircleIcon weight="fill" className="h-4 w-4 shrink-0 text-warning" />;
  return <CheckCircleIcon weight="fill" className="h-4 w-4 shrink-0 text-success" />;
};

const ReplyRow = ({ reply, result, onRemove }: { reply: IReply; result: IContentReply; onRemove: () => void }) => {
  const errors = result.issues.filter((issue) => issue.level === 'error').length;
  const warnings = result.issues.length - errors;
  const title = result.kind === 'unknown' ? reply.label : result.pack.title;
  return (
    <li className="flex flex-col gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm">
      <div className="flex items-center gap-2">
        <ReplyMark errors={errors} warnings={warnings} />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium text-foreground">
            {KIND_LABEL[result.kind]}
            {title}
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {reply.label} · {replyWhat(result)}
            {errors ? ` · ${countLabel(errors, 'problem')}` : ''}
            {warnings ? ` · ${countLabel(warnings, 'warning')}` : ''}
          </span>
        </span>
        <Button isSubtle className="px-1.5 py-1.5" title={`Remove ${reply.label}`} onClick={onRemove}>
          <TrashIcon weight="bold" className="h-4 w-4" />
        </Button>
      </div>
      {result.issues.length ? <AiIssueList issues={result.issues} /> : null}
      {result.kind === 'lessons' && result.imported.length ? (
        <ul className="flex flex-col gap-1 text-xs">
          {result.imported.map((item) => (
            <li key={item.material.ref} className="flex items-center gap-1.5">
              <BookOpenTextIcon className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="truncate text-foreground">{item.dto.name}</span>
              <Badge tone="neutral" appearance="soft" className="px-1 py-0 text-xxs capitalize">
                {item.dto.level}
              </Badge>
              <span className="text-muted-foreground">· {item.dto.durationMins} min</span>
            </li>
          ))}
        </ul>
      ) : null}
      {result.kind === 'quiz' && result.imported.length ? (
        <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <FileTextIcon className="h-3.5 w-3.5" />
          {result.pack.spec.name}: {countLabel(result.imported.length, 'question')}, {result.pack.spec.durationMins} min
        </p>
      ) : null}
    </li>
  );
};

/**
 * Fills a course's planned lessons and quizzes: one prompt per day for its lessons, one per quiz,
 * replies imported together. Each import links what it created into the right module and settles
 * the pending items, so the course page's "to generate" counts fall as the work is done.
 */
export const AiCourseModulesDrawer = ({ isOpen, onClose, course, modules }: IProps) => {
  const standardStore = useStandardLookups();
  const materialStore = useMaterialLookups();
  const courseStore = useCourseLookups();
  const [state, setState] = useSetState<IState>({ step: 'prompts', replies: [], isImporting: false });
  const [draft, setDraft] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  // Quiz paper ids by pending key, minted once per drawer session (see `buildCoursePrompts`).
  const paperIds = useRef(new Map<string, string>());

  useEffect(() => {
    if (!isOpen) return;
    setState({ step: 'prompts', replies: [] });
    setDraft('');
    paperIds.current = new Map();
    if (standardStore.shouldLoad('chapters')) standardStore.loadOrgChapters();
    materialStore.loadStandardsMaterials(course.standards ?? []);
  }, [isOpen]);

  const context: ICourseModuleContext = useMemo(() => {
    const standardIds = course.standards ?? [];
    const subjectIds = course.subjects?.length
      ? course.subjects
      : standardStore.getStandardsSubjectItems(standardIds).map((item) => item.value);
    return {
      course,
      modules,
      standards: standardStore.getStandardsByIds(standardIds),
      subjects: standardStore.getSubjectsByIds(subjectIds),
      chapters: standardStore.getChapters().filter((chapter) => standardIds.includes(chapter.standard)),
      materials: materialStore.getMaterialsByStandardIds(standardIds),
    };
  }, [course, modules, standardStore, materialStore]);

  const prompts = useMemo(
    () =>
      buildCoursePrompts(context, (pendingKey) => {
        const existing = paperIds.current.get(pendingKey);
        if (existing) return existing;
        const minted = getObjectId();
        paperIds.current.set(pendingKey, minted);
        return minted;
      }),
    [context],
  );

  const packItems = useMemo(
    () => [
      ...prompts.lessons.map((pack) => ({
        key: `lessons:${pack.moduleId}`,
        title: `Lessons — ${pack.title}`,
        prompt: pack.prompt,
      })),
      ...prompts.quizzes.map((pack) => ({
        key: `quiz:${pack.testPaperId}`,
        title: `Quiz — ${pack.title}`,
        prompt: pack.prompt,
      })),
    ],
    [prompts],
  );

  const results = useMemo(
    () => state.replies.map((reply) => ({ reply, result: readContentReply(reply.text, prompts, context) })),
    [state.replies, prompts, context],
  );
  const ready = results.filter((row): row is { reply: IReply; result: ILessonReply | IQuizReply } => {
    const { result } = row;
    return result.kind !== 'unknown' && !hasErrors(result.issues) && result.imported.length > 0;
  });
  const readyLessons = ready
    .filter(({ result }) => result.kind === 'lessons')
    .reduce((sum, { result }) => sum + result.imported.length, 0);
  const readyQuizzes = ready.filter(({ result }) => result.kind === 'quiz').length;

  const addReplies = (items: { label: string; text: string }[]) =>
    setState({ replies: [...state.replies, ...items.map((item) => ({ key: getObjectId(), ...item }))] });

  const readFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    addReplies(await Promise.all([...list].map(async (file) => ({ label: file.name, text: await file.text() }))));
    if (fileRef.current) fileRef.current.value = '';
  };

  const importAll = async () => {
    if (!ready.length || state.isImporting) return;
    setState({ isImporting: true });
    let lessonsWritten = 0;
    let quizzesWritten = 0;
    // `order` is unique per standard and subject. Every lesson reply computed its own start from
    // the same snapshot, so two replies for one subject would collide; one cursor per pair, moved
    // as rows are assigned, keeps every import in this run distinct.
    const orderCursor = new Map<string, number>();
    const nextOrder = (standard: string, subject: string): number => {
      const key = `${standard}:${subject}`;
      const current =
        orderCursor.get(key) ??
        materialStore
          .getMaterialsByStandardIds([standard])
          .filter((material) => material.subject === subject && !material.isNew)
          .reduce((max, material) => Math.max(max, material.order ?? 0), 0);
      orderCursor.set(key, current + 1);
      return current + 1;
    };
    try {
      for (const { reply, result } of ready) {
        const srcByRef = await uploadAiFigures(figuresOf(reply.text));
        if (result.kind === 'lessons') {
          const rows: MaterialDto[] = result.imported.map((item) => ({
            ...withFigureSources(item.dto, srcByRef),
            order: nextOrder(result.pack.standardId, result.pack.subjectId),
          }));
          const saved = await MaterialService.bulkUpsertMaterials(rows);
          if (saved?.data) materialStore.addMaterials(saved.data);
          const linked = await CourseService.linkCourseModule({
            courseModule: result.pack.moduleId,
            materials: rows.map((row) => row._id),
            done: result.imported
              .map((item) => ({ key: result.pack.pendingKeyByRef[item.material.ref], createdId: item.dto._id }))
              .filter((item) => !!item.key),
          });
          if (linked?.data) courseStore.addCourseModules([linked.data]);
          lessonsWritten += rows.length;
        } else if (result.kind === 'quiz') {
          await createPaperFromImport({
            testPaperId: result.pack.testPaperId,
            name: result.pack.spec.name,
            standards: result.pack.standardIds,
            subjects: result.pack.subjectIds,
            durationMins: result.pack.spec.durationMins,
            imported: result.imported.map((item) => ({ ...item, dto: withFigureSources(item.dto, srcByRef) })),
          });
          const linked = await CourseService.linkCourseModule({
            courseModule: result.pack.moduleId,
            testPapers: [result.pack.testPaperId],
            done: [{ key: result.pack.pendingKey, createdId: result.pack.testPaperId }],
          });
          if (linked?.data) courseStore.addCourseModules([linked.data]);
          quizzesWritten += 1;
        }
      }
      successToast({
        message: `${countLabel(lessonsWritten, 'lesson')} and ${countLabel(quizzesWritten, 'quiz').replace('quizs', 'quizzes')} added to the course.`,
      });
      onClose();
      await courseStore.loadCourseModules(course._id);
      await persistCourseStats(course._id);
    } catch (error) {
      reportError(
        error,
        lessonsWritten || quizzesWritten
          ? 'Some content was added before the failure; the rest was not.'
          : 'Could not add the content.',
      );
      await courseStore.loadCourseModules(course._id);
    } finally {
      setState({ isImporting: false });
    }
  };

  const importLabel = state.isImporting
    ? 'Adding…'
    : `Add ${countLabel(readyLessons, 'lesson')}${readyQuizzes ? ` and ${countLabel(readyQuizzes, 'quiz').replace('quizs', 'quizzes')}` : ''}`;

  const renderStep = () => {
    if (state.step === 'prompts') {
      if (!packItems.length) {
        return (
          <DrawerSection
            title="Nothing left to generate"
            hint="Every planned lesson and quiz in this course already exists."
          >
            <p className="text-sm text-muted-foreground">
              Add more planned items by editing a module, or review and publish the course.
            </p>
          </DrawerSection>
        );
      }
      return (
        <AiPromptPackStep
          packs={packItems}
          heading={`${countLabel(prompts.lessons.length, 'lesson prompt')} and ${countLabel(prompts.quizzes.length, 'quiz prompt')}`}
          hint="Run each in its own chat with a model that has web search. Add the replies in the next step, in any order, as they arrive."
          tips={[
            "Each lesson prompt writes one day's lessons together, so they build on each other.",
            'Each quiz is its own paper: one prompt, one reply.',
            'If a reply reports issues, paste them back and ask for the corrected JSON only.',
          ]}
        />
      );
    }
    return (
      <div className="flex flex-col gap-6">
        <DrawerSection
          title="The models' replies"
          isRequired
          hint="Upload the .json files, or paste a reply and add it. Each is matched to the day or quiz it answers."
          action={
            <>
              <input
                ref={fileRef}
                type="file"
                multiple
                accept="application/json,.json,.txt"
                className="hidden"
                onChange={(event) => readFiles(event.target.files)}
              />
              <Button
                isSecondary
                text="Upload files"
                leftsection={<UploadSimpleIcon weight="bold" className="h-4 w-4" />}
                onClick={() => fileRef.current?.click()}
              />
            </>
          }
        >
          <div className="flex flex-col gap-2">
            <TextArea
              value={draft}
              onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => setDraft(event.target.value)}
              rows={5}
              className="font-mono text-xs leading-5"
              placeholder='{ "format": "acadimic.study-material/v1", ... }  or  { "format": "acadimic.test-paper/v1", ... }'
              aria-label="Pasted reply"
            />
            <div>
              <Button
                isSecondary
                text="Add reply"
                leftsection={<PlusIcon weight="bold" className="h-4 w-4" />}
                onClick={() => {
                  if (!draft.trim()) return;
                  addReplies([{ label: `Pasted reply ${state.replies.length + 1}`, text: draft }]);
                  setDraft('');
                }}
                disabled={!draft.trim()}
              />
            </div>
          </div>
          {results.length ? (
            <ul className="mt-2 flex flex-col gap-1.5">
              {results.map(({ reply, result }) => (
                <ReplyRow
                  key={reply.key}
                  reply={reply}
                  result={result}
                  onRemove={() => setState({ replies: state.replies.filter((row) => row.key !== reply.key) })}
                />
              ))}
            </ul>
          ) : null}
        </DrawerSection>
      </div>
    );
  };

  return (
    <Modal
      position={PositionType.RIGHT}
      className="w-full md:w-[52rem] md:max-w-[92%]"
      title="Generate the course's content"
      description="One prompt per day for its lessons and one per quiz. Replies are matched to their day, imported, and linked into the course."
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
          note={
            state.step === 'prompts'
              ? `${countLabel(packItems.length, 'prompt')}`
              : `${ready.length} ${ready.length === 1 ? 'reply' : 'replies'} ready`
          }
          isFirstStep={state.step === 'prompts'}
          isLastStep={state.step === 'import'}
          nextLabel="I have replies"
          importLabel={importLabel}
          canImport={ready.length > 0}
          isImporting={state.isImporting}
          onClose={onClose}
          onBack={() => setState({ step: 'prompts' })}
          onNext={() => setState({ step: 'import' })}
          onImport={importAll}
        />
      }
    />
  );
};
