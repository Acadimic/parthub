import { Select } from '@components/app/selects';
import { DrawerSection, TextArea, TextInput } from '@repo/ui/app';
import { Badge } from '@repo/ui/core';
import { type ISelectItem } from '@interfaces';
import {
  EXAM_STYLES,
  type IAiMaterialContext,
  type IAiMaterialSetup,
  LANGUAGES,
  levelLadder,
  MATERIAL_DEFAULTS,
} from '@utils/ai/study-material-generator';
import { RESEARCH_TOGGLES, ResearchToggle } from './AiMaterialSetup';

export type IWholeMaterialSetup = Omit<IAiMaterialSetup, 'chapterIds'> & {
  standards: string[];
  /** Empty means every subject of each standard. */
  subjects: string[];
};

interface IProps {
  setup: IWholeMaterialSetup;
  onChange: (fields: Partial<IWholeMaterialSetup>) => void;
  standardItems: ISelectItem[];
  subjectItems: ISelectItem[];
  /** The standard-and-subject pairs the setup resolves to, one prompt each. */
  contexts: IAiMaterialContext[];
}

/** Step one of a whole standard: who it is for, how deep, and what to attach; then what will be made. */
export const AiWholeMaterialSetup = ({ setup, onChange, standardItems, subjectItems, contexts }: IProps) => {
  const ladder = levelLadder(setup.lessonCount);
  const counts = ladder.reduce<Record<string, number>>(
    (map, level) => ({ ...map, [level]: (map[level] ?? 0) + 1 }),
    {},
  );
  return (
    <div className="flex flex-col gap-6">
      <DrawerSection
        title="Who is it for"
        isRequired
        hint="Pick the standards. Subjects are optional: leave them empty for every subject of each standard."
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

      <DrawerSection
        title="Depth and style"
        hint="Lessons per subject climb from easy to hard and close with an exam-preparation sheet."
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <TextInput
            label="Lessons per subject"
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
        <div className="grid gap-2 sm:grid-cols-2">
          {RESEARCH_TOGGLES.map((toggle) => (
            <ResearchToggle
              key={toggle.key}
              toggle={toggle}
              idPrefix="ai-whole-material"
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

      {contexts.length ? (
        <DrawerSection
          title="What will be created"
          hint="One prompt per subject, each producing its own graded set. You can edit everything after the import."
        >
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="neutral" appearance="soft">
                {contexts.length} {contexts.length === 1 ? 'subject' : 'subjects'}
              </Badge>
              <Badge tone="success" appearance="soft">
                {counts.easy ?? 0} easy
              </Badge>
              <Badge tone="warning" appearance="soft">
                {counts.medium ?? 0} medium
              </Badge>
              <Badge tone="destructive" appearance="soft">
                {counts.hard ?? 0} hard
              </Badge>
              {setup.includeExamPrep ? (
                <Badge tone="neutral" appearance="soft">
                  + exam prep each
                </Badge>
              ) : null}
            </div>
            <ul className="mt-3 flex flex-col gap-1.5">
              {contexts.map((context) => (
                <li
                  key={`${context.standard._id}:${context.subject._id}`}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm"
                >
                  <span className="font-medium text-foreground">
                    {context.standard.name} · {context.subject.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {setup.lessonCount} lessons{setup.includeExamPrep ? ' + exam prep' : ''}
                    {context.chapters.length ? ` · ${context.chapters.length} chapters known` : ' · whole syllabus'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </DrawerSection>
      ) : null}
    </div>
  );
};
