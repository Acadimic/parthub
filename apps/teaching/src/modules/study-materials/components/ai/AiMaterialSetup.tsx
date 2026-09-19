import { Select } from '@components/app/selects';
import { DrawerSection, TextArea, TextInput } from '@repo/ui/app';
import { Badge, Checkbox } from '@repo/ui/core';
import { LevelType } from '@enums';
import { type ISelectItem } from '@interfaces';
import {
  EXAM_STYLES,
  type IAiMaterialSetup,
  LANGUAGES,
  levelLadder,
  MATERIAL_DEFAULTS,
} from '@utils/ai/study-material-generator';

interface IProps {
  setup: IAiMaterialSetup;
  onChange: (fields: Partial<IAiMaterialSetup>) => void;
  chapterItems: ISelectItem[];
  standardName: string;
  subjectName: string;
}

const LEVEL_TONE: Record<LevelType, 'success' | 'warning' | 'destructive'> = {
  [LevelType.EASY]: 'success',
  [LevelType.MEDIUM]: 'warning',
  [LevelType.HARD]: 'destructive',
};

export interface IToggle {
  key: 'includeVideos' | 'includeArticles' | 'includePdfs' | 'includeExamPrep';
  label: string;
  hint: string;
}

export const RESEARCH_TOGGLES: IToggle[] = [
  { key: 'includeVideos', label: 'Videos', hint: 'YouTube lessons to watch alongside' },
  { key: 'includeArticles', label: 'Web references', hint: 'Articles and interactive pages to read' },
  { key: 'includePdfs', label: 'PDF sources', hint: 'Textbook chapters, notes, worksheets' },
  { key: 'includeExamPrep', label: 'Exam-preparation sheet', hint: 'Key terms, concepts, formulas, traps' },
];

/** One research option as a labelled card, so the whole row is the click target. */
export const ResearchToggle = ({
  toggle,
  idPrefix,
  checked,
  onChange,
}: {
  toggle: IToggle;
  idPrefix: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) => (
  <label
    htmlFor={`${idPrefix}-${toggle.key}`}
    className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-border bg-background px-3 py-2.5 transition-colors hover:border-primary/40"
  >
    <Checkbox id={`${idPrefix}-${toggle.key}`} checked={checked} onChange={onChange} className="mt-0.5" />
    <span className="min-w-0">
      <span className="block text-sm font-medium text-foreground">{toggle.label}</span>
      <span className="block text-xs text-muted-foreground">{toggle.hint}</span>
    </span>
  </label>
);

/** Step one: scope, size and what to attach. The ladder of levels is shown, not asked. */
export const AiMaterialSetup = ({ setup, onChange, chapterItems, standardName, subjectName }: IProps) => {
  const ladder = levelLadder(setup.lessonCount);
  return (
    <div className="flex flex-col gap-6">
      <DrawerSection
        title="What to teach"
        hint={`Pick chapters, or leave empty for the whole ${subjectName} syllabus of ${standardName}.`}
      >
        <Select
          label="Chapters"
          items={chapterItems}
          values={setup.chapterIds}
          onChange={(items) => onChange({ chapterIds: items.map((item) => item.value) })}
          placeholder={chapterItems.length ? 'Whole subject' : 'No chapters yet — the whole subject'}
          isDisabled={!chapterItems.length}
        />
      </DrawerSection>

      <DrawerSection title="Size and style" hint="Sensible defaults; change them if you like.">
        <div className="grid gap-3 sm:grid-cols-3">
          <TextInput
            label="Lessons"
            type="number"
            min={MATERIAL_DEFAULTS.minLessons}
            max={MATERIAL_DEFAULTS.maxLessons}
            className="font-mono"
            value={setup.lessonCount}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              onChange({
                lessonCount: Math.min(
                  MATERIAL_DEFAULTS.maxLessons,
                  Math.max(MATERIAL_DEFAULTS.minLessons, Math.floor(Number(event.target.value) || 0)),
                ),
              })
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
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">The ladder:</span>
          {ladder.map((level, index) => (
            <Badge key={index} tone={LEVEL_TONE[level]} appearance="soft" className="px-1.5 py-0 text-xxs capitalize">
              {index + 1} · {level}
            </Badge>
          ))}
          {setup.includeExamPrep ? (
            <Badge tone="neutral" appearance="soft" className="px-1.5 py-0 text-xxs">
              + exam prep
            </Badge>
          ) : null}
        </div>
      </DrawerSection>

      <DrawerSection
        title="Research and attachments"
        hint="The model searches the web and cites real pages. Every address is checked before it is saved."
      >
        <div className="grid gap-2 sm:grid-cols-2">
          {RESEARCH_TOGGLES.map((toggle) => (
            <ResearchToggle
              key={toggle.key}
              toggle={toggle}
              idPrefix="ai-material"
              checked={setup[toggle.key]}
              onChange={(checked) => onChange({ [toggle.key]: checked })}
            />
          ))}
        </div>
        <TextArea
          label="Anything else"
          value={setup.instructions}
          onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => onChange({ instructions: event.target.value })}
          placeholder="Optional: the textbook you follow, topics to stress, things to leave out, the tone you want."
        />
      </DrawerSection>
    </div>
  );
};
