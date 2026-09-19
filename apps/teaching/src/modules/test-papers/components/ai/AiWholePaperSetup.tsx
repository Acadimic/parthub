import { type SubjectDto } from '@repo/shared/contracts';
import { Select } from '@components/app/selects';
import { DrawerSection, TextArea, TextInput } from '@repo/ui/app';
import { Badge } from '@repo/ui/core';
import { type ISelectItem } from '@interfaces';
import { EXAM_STYLES, type IAiSectionPlan, LANGUAGES, totalCount } from '@utils/ai/test-paper-generator';
import { QUESTION_TYPE_ORDER, QUESTION_TYPES } from '../question-types';

export interface IWholePaperSetup {
  standards: string[];
  subjects: string[];
  totalQuestions: number;
  examStyle: string;
  language: string;
  instructions: string;
}

interface IProps {
  setup: IWholePaperSetup;
  onChange: (fields: Partial<IWholePaperSetup>) => void;
  standardItems: ISelectItem[];
  subjectItems: ISelectItem[];
  /** What the drawer has decided from the setup so far, shown so nothing is a surprise at import. */
  plan: IAiSectionPlan[];
  paperName: string;
  durationMins: number;
  subjects: SubjectDto[];
}

/** Step one of a whole paper: the two things only a teacher can say, and a preview of the rest. */
export const AiWholePaperSetup = ({
  setup,
  onChange,
  standardItems,
  subjectItems,
  plan,
  paperName,
  durationMins,
}: IProps) => (
  <div className="flex flex-col gap-6">
    <DrawerSection
      title="Who is it for"
      isRequired
      hint="Pick the standard. Subjects are optional: leave them empty for every subject of the standard, or pick some to get one section each."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Select
          label="Standards"
          required
          items={standardItems}
          isGrouped
          values={setup.standards}
          // A standard change can orphan a subject choice, so the subjects reset with it.
          onChange={(items) => onChange({ standards: items.map((item) => item.value), subjects: [] })}
          placeholder="Select standards"
        />
        <Select
          label="Subjects"
          items={subjectItems}
          values={setup.subjects}
          onChange={(items) => onChange({ subjects: items.map((item) => item.value) })}
          isDisabled={!setup.standards.length}
          placeholder={setup.standards.length ? 'All subjects' : 'Choose a standard first'}
        />
      </div>
    </DrawerSection>

    <DrawerSection title="Size and style" hint="Sensible defaults; change them if you like.">
      <div className="grid gap-3 sm:grid-cols-3">
        <TextInput
          label="Questions"
          type="number"
          min={1}
          max={200}
          className="font-mono"
          value={setup.totalQuestions}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            onChange({ totalQuestions: Math.min(200, Math.max(1, Math.floor(Number(event.target.value) || 0))) })
          }
        />
        <Select
          label="Exam style"
          items={EXAM_STYLES.map((style) => ({ label: style, value: style }))}
          values={[setup.examStyle]}
          onChange={(items) => items[0] && onChange({ examStyle: items[0].value })}
          isSingleSelect
          noSort
        />
        <Select
          label="Language"
          items={LANGUAGES.map((language) => ({ label: language, value: language }))}
          values={[setup.language]}
          onChange={(items) => items[0] && onChange({ language: items[0].value })}
          isSingleSelect
          noSort
        />
      </div>
      <TextArea
        label="Anything else"
        value={setup.instructions}
        onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => onChange({ instructions: event.target.value })}
        placeholder="Optional: syllabus notes, topics to stress, things to avoid."
      />
    </DrawerSection>

    {setup.standards.length ? (
      <DrawerSection
        title="What will be created"
        hint="Decided from your choices. You can edit all of it after the import."
      >
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-foreground">{paperName}</span>
            <Badge tone="neutral" appearance="soft">
              Quiz
            </Badge>
            <Badge tone="neutral" appearance="soft">
              {durationMins} min
            </Badge>
            <Badge tone="neutral" appearance="soft">
              {plan.reduce((sum, section) => sum + totalCount(section.counts), 0)} questions
            </Badge>
            <Badge tone="success" appearance="soft">
              with solutions
            </Badge>
          </div>
          <ul className="mt-3 flex flex-col gap-1.5">
            {plan.map((section) => (
              <li key={section.key} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <span className="font-medium text-foreground">{section.name}</span>
                <span className="text-xs text-muted-foreground">
                  {QUESTION_TYPE_ORDER.filter((type) => section.counts[type] > 0)
                    .map((type) => `${section.counts[type]} ${QUESTION_TYPES[type].label.toLowerCase()}`)
                    .join(' · ')}
                  {section.chapterIds.length ? ` · ${section.chapterIds.length} chapters` : ''}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </DrawerSection>
    ) : null}
  </div>
);
