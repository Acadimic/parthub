import { type CourseDto, type CourseModuleDto, type ILinkCheck } from '@repo/shared/contracts';
import { type IAiCourseReview } from '@repo/shared/interfaces';
import { AiIssueList } from '@components/app/ai';
import {
  ArrowsClockwiseIcon,
  CheckCircleIcon,
  CheckIcon,
  CopyIcon,
  RocketLaunchIcon,
  WarningCircleIcon,
  XCircleIcon,
} from '@phosphor-icons/react';
import { Button, DrawerSection, Modal, TextArea } from '@repo/ui/app';
import { Badge, Spinner } from '@repo/ui/core';
import { cn } from '@repo/ui/lib';
import { PositionType } from '@enums';
import { CommonService } from '@services';
import { useCourseLookups, useMaterialLookups, useMeetLookups, useTestPaperLookups } from '@stores';
import { type IAiIssue } from '@utils/ai/common';
import {
  buildCourseReviewPrompt,
  collectCourseLinks,
  type ICourseReviewInput,
  type ICoverageRow,
  type IDayPace,
  parseCourseReview,
  reviewCourse,
} from '@utils/ai/course-review';
import { errorToast, reportError, successToast } from '@utils/helpers';
import { useEffect, useMemo, useState } from 'react';
import { useSetState } from 'react-use';

interface IProps {
  isOpen: boolean;
  onClose: () => void;
  course: CourseDto;
  modules: CourseModuleDto[];
}

interface IState {
  linkState: 'idle' | 'checking' | 'done' | 'failed';
  reviewText: string;
  isCopied: boolean;
  isPublishing: boolean;
}

const SEVERITY_TONE = { error: 'destructive', warning: 'warning', info: 'neutral' } as const;

const linkButtonLabel = (state: IState['linkState'], checked: number, dead: number): string => {
  if (state === 'checking') return 'Checking…';
  if (checked) return `References: ${dead} dead`;
  if (state === 'done') return 'No references to check';
  return 'Check references';
};

const CoverageSection = ({ coverage }: { coverage: ICoverageRow[] }) =>
  coverage.length ? (
    <DrawerSection title="Syllabus coverage" hint="Each line of the outline and the days that teach it.">
      <ul className="flex flex-col gap-1 text-xs">
        {coverage.map((row) => (
          <li key={row.line} className="flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5">
            {row.days.length ? (
              <CheckCircleIcon weight="fill" className="h-3.5 w-3.5 shrink-0 text-success" />
            ) : (
              <XCircleIcon weight="fill" className="h-3.5 w-3.5 shrink-0 text-destructive" />
            )}
            <span className="min-w-0 flex-1 truncate text-foreground">{row.line}</span>
            <span className="shrink-0 font-mono text-xxs text-muted-foreground">
              {row.days.length ? `D${row.days.join(', D')}` : 'no day'}
            </span>
          </li>
        ))}
      </ul>
    </DrawerSection>
  ) : null;

const PaceSection = ({ pace, medianMins }: { pace: IDayPace[]; medianMins: number }) => (
  <DrawerSection
    title="Load per day"
    hint="Minutes of linked lessons, quizzes and sessions. The dashed line is the median."
  >
    <ul className="flex flex-col gap-1">
      {pace.map((row) => {
        const width = medianMins ? Math.min(100, Math.round((row.minutes / (medianMins * 2)) * 100)) : 0;
        const isOff = medianMins > 0 && (row.minutes > medianMins * 1.6 || row.minutes < medianMins * 0.4);
        return (
          <li key={row.day} className="flex items-center gap-2 text-xs">
            <span className="w-8 shrink-0 font-mono text-muted-foreground">D{row.day}</span>
            <span className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <span
                className={cn('absolute inset-y-0 left-0 rounded-full', isOff ? 'bg-warning' : 'bg-primary')}
                style={{ width: `${width}%` }}
              />
              <span
                className="absolute inset-y-0 border-l border-dashed border-foreground/40"
                style={{ left: '50%' }}
              />
            </span>
            <span className="w-14 shrink-0 text-right font-mono text-muted-foreground">{row.minutes} min</span>
          </li>
        );
      })}
    </ul>
  </DrawerSection>
);

const FindingsList = ({ review }: { review: IAiCourseReview }) => (
  <div className="flex flex-col gap-2">
    {review.summary ? <p className="text-sm text-foreground">{review.summary}</p> : null}
    <ul className="flex flex-col gap-1.5">
      {review.findings.map((finding, index) => (
        <li key={index} className="rounded-lg border border-border px-3 py-2 text-xs">
          <div className="flex items-center gap-1.5">
            <Badge
              tone={SEVERITY_TONE[finding.severity] ?? 'neutral'}
              appearance="soft"
              className="px-1.5 py-0 text-xxs capitalize"
            >
              {finding.severity}
            </Badge>
            <span className="font-mono text-xxs text-muted-foreground">{finding.where}</span>
          </div>
          <p className="mt-1 text-foreground">{finding.issue}</p>
          <p className="mt-0.5 inline-flex items-start gap-1 text-muted-foreground">
            <WarningCircleIcon className="mt-0.5 h-3 w-3 shrink-0" />
            {finding.suggestion}
          </p>
        </li>
      ))}
    </ul>
  </div>
);

const PublishFooter = ({
  course,
  canPublish,
  isPublishing,
  onClose,
  onPublish,
}: {
  course: CourseDto;
  canPublish: boolean;
  isPublishing: boolean;
  onClose: () => void;
  onPublish: (isPublished: boolean) => void;
}) => (
  <div className="flex w-full items-center justify-between gap-3">
    <div className="flex items-center gap-3">
      <Button isSubtle text="Close" onClick={onClose} disabled={isPublishing} />
      <span className="hidden text-xs text-muted-foreground sm:inline">
        {course.isPublished ? 'Published' : 'Draft'}
      </span>
    </div>
    {course.isPublished ? (
      <Button isSecondary text="Back to draft" onClick={() => onPublish(false)} isLoading={isPublishing} />
    ) : (
      <Button
        text="Publish course"
        leftsection={<RocketLaunchIcon weight="bold" className="h-4 w-4" />}
        onClick={() => onPublish(true)}
        disabled={!canPublish}
        isLoading={isPublishing}
        title={canPublish ? undefined : 'Fix the problems above first'}
      />
    )}
  </div>
);

/**
 * Everything a teacher should know before publishing: the checks the app can run itself
 * (empty or unfinished days, dead references, coverage, pace, the ladder), an optional review by
 * a model from a digest of the course, and the publish switch, which errors keep off.
 */
export const AiCourseReviewDrawer = ({ isOpen, onClose, course, modules }: IProps) => {
  const courseStore = useCourseLookups();
  const materialStore = useMaterialLookups();
  const testPaperStore = useTestPaperLookups();
  const meetStore = useMeetLookups();
  const [state, setState] = useSetState<IState>({
    linkState: 'idle',
    reviewText: '',
    isCopied: false,
    isPublishing: false,
  });
  const [linkChecks, setLinkChecks] = useState<Map<string, ILinkCheck>>(new Map());
  const [modelReview, setModelReview] = useState<IAiCourseReview | null>(null);
  const [reviewIssues, setReviewIssues] = useState<IAiIssue[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    setState({ linkState: 'idle', reviewText: '', isCopied: false });
    setLinkChecks(new Map());
    setModelReview(null);
    setReviewIssues([]);
  }, [isOpen]);

  const input: ICourseReviewInput = useMemo(() => {
    const materialIds = modules.flatMap((courseModule) => courseModule.materials ?? []);
    const testPaperIds = modules.flatMap((courseModule) => courseModule.testPapers ?? []);
    const meetIds = modules.flatMap((courseModule) => courseModule.meets ?? []);
    return {
      course,
      modules,
      materialById: new Map(materialStore.getMaterialsByIds(materialIds).map((row) => [row._id, row])),
      testPaperById: new Map(testPaperStore.getTestPapersByIds(testPaperIds).map((row) => [row._id, row])),
      meetById: new Map(meetStore.getMeetsByIds(meetIds).map((row) => [row._id, row])),
      linkChecks,
    };
  }, [course, modules, materialStore, testPaperStore, meetStore, linkChecks]);

  const review = useMemo(() => reviewCourse(input), [input]);
  const prompt = useMemo(() => buildCourseReviewPrompt(input), [input]);

  const checkLinks = async () => {
    const urls = collectCourseLinks(input);
    if (!urls.length) {
      setState({ linkState: 'done' });
      return;
    }
    setState({ linkState: 'checking' });
    try {
      const results = new Map<string, ILinkCheck>();
      for (let index = 0; index < urls.length; index += 60) {
        const { data } = await CommonService.verifyLinks(urls.slice(index, index + 60));
        (data ?? []).forEach((check) => results.set(check.url, check));
      }
      setLinkChecks(results);
      setState({ linkState: 'done' });
    } catch {
      setState({ linkState: 'failed' });
    }
  };

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setState({ isCopied: true });
      setTimeout(() => setState({ isCopied: false }), 2000);
    } catch {
      errorToast({ message: 'Could not copy. Select the text and copy it by hand.' });
    }
  };

  const readReview = (text: string) => {
    setState({ reviewText: text });
    const parsed = parseCourseReview(text, course._id);
    setReviewIssues(parsed.issues);
    setModelReview(parsed.review);
  };

  const setPublished = async (isPublished: boolean) => {
    setState({ isPublishing: true });
    try {
      await courseStore.setCoursePublished(course._id, isPublished);
      successToast({ message: isPublished ? `"${course.name}" is published.` : `"${course.name}" is back in draft.` });
      onClose();
    } catch (error) {
      reportError(error, 'Could not change the course status.');
    } finally {
      setState({ isPublishing: false });
    }
  };

  const errors = review.issues.filter((issue) => issue.level === 'error');
  const warnings = review.issues.length - errors.length;
  const deadLinkCount = [...linkChecks.values()].filter((check) => !check.ok).length;

  return (
    <Modal
      position={PositionType.RIGHT}
      className="w-full md:w-[52rem] md:max-w-[92%]"
      title="Review and publish"
      description="What the app can check itself, what a model can add, and the publish switch. Errors keep it off; warnings do not."
      isOpen={isOpen}
      onClose={() => !state.isPublishing && onClose()}
      component={
        <div className="flex flex-col gap-6">
          <DrawerSection
            title={
              errors.length
                ? `${errors.length} ${errors.length === 1 ? 'problem' : 'problems'} to fix before publishing`
                : 'Ready to publish'
            }
            hint={`${warnings} ${warnings === 1 ? 'warning' : 'warnings'} · ${review.pendingCount} ${review.pendingCount === 1 ? 'item' : 'items'} still to generate · median day ${review.medianMins} min`}
            action={
              <Button
                isSecondary
                text={linkButtonLabel(state.linkState, linkChecks.size, deadLinkCount)}
                leftsection={
                  state.linkState === 'checking' ? (
                    <Spinner size="sm" />
                  ) : (
                    <ArrowsClockwiseIcon weight="bold" className="h-4 w-4" />
                  )
                }
                onClick={checkLinks}
                disabled={state.linkState === 'checking'}
              />
            }
          >
            {review.issues.length ? (
              <AiIssueList issues={review.issues} />
            ) : (
              <p className="inline-flex items-center gap-1.5 text-xs text-success">
                <CheckCircleIcon weight="fill" className="h-4 w-4" />
                Every day has content, every reference reachable, the syllabus covered.
              </p>
            )}
            {state.linkState === 'failed' ? (
              <p className="mt-2 text-xs text-foreground">The references could not be checked.</p>
            ) : null}
          </DrawerSection>

          <CoverageSection coverage={review.coverage} />
          <PaceSection pace={review.pace} medianMins={review.medianMins} />

          <DrawerSection
            title="Ask a model to review it"
            hint="Optional. Copy the digest, paste the reply. Nothing is changed; the findings are for you."
            action={
              <Button
                isSecondary
                text={state.isCopied ? 'Copied' : 'Copy review prompt'}
                leftsection={
                  state.isCopied ? (
                    <CheckIcon weight="bold" className="h-4 w-4" />
                  ) : (
                    <CopyIcon weight="bold" className="h-4 w-4" />
                  )
                }
                onClick={copyPrompt}
              />
            }
          >
            <TextArea
              value={state.reviewText}
              onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => readReview(event.target.value)}
              rows={4}
              className="font-mono text-xs leading-5"
              placeholder='{ "format": "acadimic.course-review/v1", ... }'
              aria-label="Review reply"
            />
            {reviewIssues.length ? <AiIssueList issues={reviewIssues} /> : null}
            {modelReview ? <FindingsList review={modelReview} /> : null}
          </DrawerSection>
        </div>
      }
      footer={
        <PublishFooter
          course={course}
          canPublish={review.canPublish}
          isPublishing={state.isPublishing}
          onClose={onClose}
          onPublish={setPublished}
        />
      }
    />
  );
};
