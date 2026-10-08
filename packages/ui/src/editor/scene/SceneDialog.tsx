import { ArrowLeftIcon, CodeIcon, CubeIcon, WarningCircleIcon } from '@phosphor-icons/react';
import {
  type ISceneCatalogEntry,
  parseScene,
  SCENE_CATALOG,
  sceneCatalogDefaults,
  type SceneFieldValue,
  type SceneFieldValues,
} from '@repo/shared/utils';
import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Button } from '../../core/Button';
import { Modal } from '../../core/Modal';
import { Spinner } from '../../core/Spinner';
import { TextInput } from '../../core/TextInput';
import { useCloseOnBack } from '../../hooks/use-close-on-back.hook';
import { SceneForm } from './SceneForm';
import { SceneGallery } from './SceneGallery';

const Scene3DViewer = lazy(() => import('../../scene/Scene3DViewer'));

/** Where a scene came from: a template and the values in its form, or JSON written by hand. */
export type SceneOrigin = { kind: 'template'; key: string; values: SceneFieldValues } | { kind: 'custom' };

/**
 * The origin as the node stores it, in its `template` attribute: the template and its values as
 * JSON, or `''` for a scene written by hand. A node attribute must be a primitive, hence the string.
 */
export const originToAttr = (origin: SceneOrigin): string =>
  origin.kind === 'template' ? JSON.stringify({ key: origin.key, values: origin.values }) : '';

export const originFromAttr = (attr: string): SceneOrigin => {
  try {
    const raw: unknown = attr ? JSON.parse(attr) : null;
    if (typeof raw === 'object' && raw !== null && 'key' in raw && 'values' in raw) {
      const key = String(raw.key);
      const values = raw.values;
      if (SCENE_CATALOG.some((entry) => entry.key === key) && typeof values === 'object' && values !== null) {
        return { kind: 'template', key, values: values as SceneFieldValues };
      }
    }
  } catch {
    // An attribute that is not the JSON this file writes reads as a hand-written scene.
  }
  return { kind: 'custom' };
};

/** How the dialog opens: on the gallery for a new scene, or on an existing scene's form or JSON. */
export type SceneDialogStart = { kind: 'new' } | { kind: 'edit'; spec: string; origin: SceneOrigin };

export interface ISceneDialogProps {
  isOpen: boolean;
  start: SceneDialogStart;
  onClose: () => void;
  /** Called only with a scene the shared parser accepts. */
  onSave: (spec: string, origin: SceneOrigin) => void;
}

/** The form being filled in: a template with its values, or the JSON by hand. */
type Draft =
  | { kind: 'gallery' }
  | { kind: 'template'; entry: ISceneCatalogEntry; values: SceneFieldValues }
  | { kind: 'custom'; json: string };

const pretty = (spec: string): string => {
  try {
    return JSON.stringify(JSON.parse(spec), null, 2);
  } catch {
    return spec;
  }
};

const draftFrom = (start: SceneDialogStart): Draft => {
  if (start.kind === 'new') return { kind: 'gallery' };
  const origin = start.origin;
  const entry = origin.kind === 'template' ? SCENE_CATALOG.find((item) => item.key === origin.key) : undefined;
  if (entry && origin.kind === 'template') {
    return { kind: 'template', entry, values: { ...sceneCatalogDefaults(entry), ...origin.values } };
  }
  return { kind: 'custom', json: pretty(start.spec) };
};

/** The JSON a draft stands for: the template built from its values, or what was typed. */
const specOf = (draft: Draft): string => {
  if (draft.kind === 'template') return JSON.stringify(draft.entry.build(draft.values));
  return draft.kind === 'custom' ? draft.json : '';
};

/** Holds a fast-changing value back until it has been still for `delay`, so the preview rebuilds once per pause. */
const useSettled = (value: string, delay: number): string => {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setSettled(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return settled;
};

interface ISceneSidebarProps {
  draft: Draft;
  spec: string;
  errors: string[];
  isAdvanced: boolean;
  onToggleAdvanced: () => void;
  onValue: (name: string, value: SceneFieldValue) => void;
  onJson: (json: string) => void;
}

/** The form for a template's key numbers, or a note for a hand-written scene, then the JSON behind "Advanced". */
const SceneSidebar = ({ draft, spec, errors, isAdvanced, onToggleAdvanced, onValue, onJson }: ISceneSidebarProps) => (
  <aside className="flex w-full shrink-0 flex-col gap-4 overflow-y-auto md:w-80">
    {draft.kind === 'template' ? (
      <SceneForm fields={draft.entry.fields} values={draft.values} onChange={onValue} />
    ) : (
      <p className="text-sm text-muted-foreground">
        This scene is written in the scene format. Change it below; the preview follows once it is valid.
      </p>
    )}
    <Button
      isSubtle
      className="self-start px-2 py-1 text-xs text-primary"
      leftSection={<CodeIcon weight="bold" className="h-4 w-4" />}
      text={isAdvanced ? 'Hide the JSON' : 'Advanced: show the JSON'}
      onClick={onToggleAdvanced}
    />
    {isAdvanced ? (
      <div className="flex flex-col gap-2">
        {draft.kind === 'template' ? (
          <p className="text-xs text-muted-foreground">
            Editing the JSON leaves the form; the template no longer applies.
          </p>
        ) : null}
        <TextInput
          multiline
          rows={16}
          aria-label="Scene JSON"
          value={draft.kind === 'custom' ? draft.json : pretty(spec)}
          onChange={(event) => onJson(event.target.value)}
          inputClassName="font-mono text-xs"
          spellCheck={false}
        />
        {errors.length ? (
          <ul className="flex flex-col gap-1 border border-destructive/30 bg-destructive/5 p-2 text-xs text-destructive">
            {errors.slice(0, 8).map((error) => (
              <li key={error} className="flex gap-1.5">
                <WarningCircleIcon weight="bold" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {error}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    ) : null}
  </aside>
);

/** The live scene, rebuilt from its first step whenever the settled scene changes; a note until it is valid. */
const ScenePreview = ({ spec }: { spec: string }) => (
  <div className="relative min-h-[50vh] flex-1 md:min-h-0">
    {spec ? (
      <Suspense
        fallback={
          <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
            <Spinner size="sm" /> Loading the preview…
          </div>
        }
      >
        <Scene3DViewer key={spec} spec={spec} autoPlay={false} />
      </Suspense>
    ) : (
      <div className="flex h-full items-center justify-center border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        The preview appears once the scene is valid.
      </div>
    )}
  </div>
);

/**
 * Inserting or editing a 3D scene. A new scene starts from the template gallery; a template opens a
 * form for its key numbers beside a live preview. "Advanced" shows the scene's JSON with the parser's
 * errors, for staff and for anything a template does not cover — editing it there leaves the form.
 * Only a scene the parser accepts can be saved. Mount it only while it is open: it reads `start`
 * once, so each opening begins afresh.
 */
export const SceneDialog = ({ isOpen, start, onClose, onSave }: ISceneDialogProps) => {
  const [draft, setDraft] = useState<Draft>(() => draftFrom(start));
  const [isAdvanced, setIsAdvanced] = useState(start.kind === 'edit' && draftFrom(start).kind === 'custom');
  useCloseOnBack(isOpen, onClose);

  const spec = specOf(draft);
  const parsed = useMemo(() => (spec ? parseScene(spec) : null), [spec]);
  const isValid = parsed?.isValid === true;
  const preview = useSettled(isValid ? spec : '', 350);

  const setValue = (name: string, value: SceneFieldValue) =>
    setDraft((current) =>
      current.kind === 'template' ? { ...current, values: { ...current.values, [name]: value } } : current,
    );

  const save = () => {
    if (!parsed?.isValid) return;
    const origin: SceneOrigin =
      draft.kind === 'template' ? { kind: 'template', key: draft.entry.key, values: draft.values } : { kind: 'custom' };
    onSave(JSON.stringify(parsed.scene), origin);
  };

  const isEditing = start.kind === 'edit';
  const title = draft.kind === 'template' ? draft.entry.title : 'Scene from JSON';

  return (
    <Modal
      position="center"
      isOpen={isOpen}
      onClose={onClose}
      title={draft.kind === 'gallery' ? 'Insert a 3D scene' : `${isEditing ? 'Edit' : 'New'} 3D scene: ${title}`}
      className="h-[100dvh] w-screen max-w-none border-0 md:h-[min(860px,92vh)] md:w-[min(1280px,94vw)] md:border md:shadow-2xl"
      childrenClassName="min-h-0 p-3 md:p-4"
      footer={
        <div className="flex flex-wrap items-center gap-2">
          {draft.kind !== 'gallery' && !isEditing ? (
            <Button
              isSubtle
              text="All templates"
              leftSection={<ArrowLeftIcon weight="bold" className="h-4 w-4" />}
              onClick={() => setDraft({ kind: 'gallery' })}
            />
          ) : null}
          <div className="ml-auto flex items-center gap-2">
            <Button isSecondary text="Cancel" onClick={onClose} />
            {draft.kind === 'gallery' ? null : (
              <Button
                text={isEditing ? 'Save scene' : 'Insert scene'}
                disabled={!isValid}
                onClick={save}
                leftSection={<CubeIcon weight="bold" className="h-4 w-4" />}
              />
            )}
          </div>
        </div>
      }
    >
      {draft.kind === 'gallery' ? (
        <div className="h-full overflow-y-auto">
          <SceneGallery
            onChoose={(entry) => {
              setDraft({ kind: 'template', entry, values: sceneCatalogDefaults(entry) });
              setIsAdvanced(false);
            }}
          />
          <button
            type="button"
            onClick={() => {
              setDraft({ kind: 'custom', json: '{\n  "version": 1,\n  "title": "",\n  "objects": []\n}' });
              setIsAdvanced(true);
            }}
            className="mt-6 text-sm font-medium text-primary hover:underline"
          >
            Start from JSON instead
          </button>
        </div>
      ) : (
        <div className="flex h-full min-h-0 flex-col gap-4 md:flex-row">
          <SceneSidebar
            draft={draft}
            spec={spec}
            errors={parsed && !parsed.isValid ? parsed.errors : []}
            isAdvanced={isAdvanced}
            onToggleAdvanced={() => setIsAdvanced(!isAdvanced)}
            onValue={setValue}
            onJson={(json) => setDraft({ kind: 'custom', json })}
          />
          <ScenePreview spec={preview} />
        </div>
      )}
    </Modal>
  );
};
