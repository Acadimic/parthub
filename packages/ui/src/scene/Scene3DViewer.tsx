import { InfoIcon, WarningCircleIcon } from '@phosphor-icons/react';
import type { ISceneSlider, SceneObjectType } from '@repo/shared/interfaces';
import { formatGraphNumber, parseScene, sceneSliderValues } from '@repo/shared/utils';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '../core/Button';
import { Slider } from '../core/Slider';
import { cn } from '../lib/cn';
import { loadBrandMark } from '../three/brand';
import { gifFrameScale, recordGif, turnRecording } from '../three/gif';
import { SceneStage, STEP_MS } from './scene-stage';
import { readSceneTheme, SceneThemeProbes } from './scene-theme';
import { type IImageColours, type IImageFooter, saveBlob } from '../three/snapshot';
import type { IStagePoint } from '../three/stage';
import { StepBar, useSteps } from './StepBar';
import { GifProgress, Readout, type Saving, SectionTitle, StageToolbar } from '../three/viewer-parts';

export interface IScene3DViewerProps {
  /** The scene's JSON, as stored on the content node. */
  spec: string;
  /** Start playing the steps as soon as it opens: yes for a reader, no for a teacher's preview. */
  autoPlay: boolean;
}

interface ISceneSidebarProps {
  sliders: ISceneSlider[];
  values: Record<string, number>;
  onValue: (name: string, value: number) => void;
  onReset: () => void;
  /** Object types this version cannot draw yet, as a reader names them. */
  later: string[];
  stepLabels: string[];
  stepIndex: number;
  onStep: (index: number) => void;
}

/**
 * The panel beside the scene: its sliders, its steps to jump between, and a note on what a later
 * update will draw. Nothing at all when the scene has none of these, so the scene takes the width.
 */
const SceneSidebar = ({
  sliders,
  values,
  onValue,
  onReset,
  later,
  stepLabels,
  stepIndex,
  onStep,
}: ISceneSidebarProps) => {
  const hasSteps = stepLabels.length > 1;
  if (!sliders.length && !later.length && !hasSteps) return null;
  return (
    <aside className="flex w-full shrink-0 flex-col gap-5 overflow-y-auto md:w-72">
      {sliders.length ? (
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <SectionTitle>Change the scene</SectionTitle>
            <Button isSubtle className="px-2 py-0.5 text-xs text-primary" onClick={onReset}>
              Reset
            </Button>
          </div>
          {sliders.map((slider) => (
            <Slider
              key={slider.name}
              label={slider.label ?? <span className="font-serif text-sm italic">{slider.name}</span>}
              value={values[slider.name] ?? slider.value}
              min={slider.min}
              max={slider.max}
              step={slider.step ?? (slider.max - slider.min) / 200}
              formatValue={formatGraphNumber}
              onChange={(value) => onValue(slider.name, value)}
            />
          ))}
        </section>
      ) : null}
      {hasSteps ? (
        // On a phone the panel sits under the scene, where the step bar already does this job.
        <section className="hidden flex-col gap-2 md:flex">
          <SectionTitle>Steps</SectionTitle>
          <ol className="flex flex-col gap-1">
            {stepLabels.map((label, index) => (
              <li key={`${index}-${label}`}>
                <button
                  type="button"
                  onClick={() => onStep(index)}
                  aria-current={index === stepIndex ? 'step' : undefined}
                  className={cn(
                    'flex w-full items-start gap-2 border px-2 py-1.5 text-left text-sm transition-colors',
                    index === stepIndex
                      ? 'border-primary bg-primary/10 font-medium text-foreground'
                      : 'border-transparent text-muted-foreground hover:bg-accent hover:text-foreground',
                  )}
                >
                  <span
                    className={cn('w-5 shrink-0 font-mono text-xs leading-5', index === stepIndex && 'text-primary')}
                  >
                    {index + 1}
                  </span>
                  <span>{label}</span>
                </button>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
      {later.length ? (
        <p className="flex gap-2 border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
          <InfoIcon weight="bold" className="mt-0.5 h-4 w-4 shrink-0" />
          This scene also has {later.join(', ')}, which a later update will draw.
        </p>
      ) : null}
    </aside>
  );
};

/** Object types as a reader would name them, for the "drawn in a later update" note. */
const TYPE_NAMES: Partial<Record<SceneObjectType, string>> = {
  die: 'dice',
  cubeGrid: 'cube grids',
  net: 'nets',
  molecule: 'molecules',
  atom: 'atoms',
  bond: 'bonds',
  lattice: 'crystal lattices',
};

/**
 * The interactive view of one 3D scene: the objects on a canvas, sliders for the scene's numbers, a
 * read-out of the point under the pointer, and PNG and GIF downloads.
 *
 * Loaded on demand (see `SceneCard` and `SceneDialog`), so three.js reaches a reader only when they
 * open a scene.
 */
const Scene3DViewer = ({ spec, autoPlay }: IScene3DViewerProps) => {
  const parsed = useMemo(() => parseScene(spec), [spec]);
  const scene = parsed.isValid ? parsed.scene : null;
  const [values, setValues] = useState<Record<string, number>>(() => (scene ? sceneSliderValues(scene) : {}));
  const [isSpinning, setIsSpinning] = useState(false);
  const [hover, setHover] = useState<IStagePoint | null>(null);
  const [isUnsupported, setIsUnsupported] = useState(false);
  const [skipped, setSkipped] = useState<SceneObjectType[]>([]);
  const [saving, setSaving] = useState<Saving>(null);
  const [gifProgress, setGifProgress] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const probesRef = useRef<HTMLDivElement>(null);
  const stage = useRef<SceneStage | null>(null);

  const readTheme = () => readSceneTheme(probesRef.current);
  const stepLabels = useMemo(() => (scene?.steps ?? []).map((step) => step.label), [scene]);
  const goToStep = useCallback((index: number) => stage.current?.setStep(index), []);
  const steps = useSteps(stepLabels.length, STEP_MS, goToStep, autoPlay);

  useEffect(() => {
    const host = stageRef.current;
    const labels = labelRef.current;
    if (!host || !labels || !scene) return undefined;
    let created: SceneStage;
    try {
      created = new SceneStage(host, labels, setHover);
    } catch {
      setIsUnsupported(true);
      return undefined;
    }
    stage.current = created;
    const applyTheme = () => {
      const { colours, line, accent } = readTheme();
      created.setTheme({ colours, line, accent });
    };
    applyTheme();
    // The apps switch theme on `<html>` and on a wrapper div; either change recolours the scene.
    const observer = new MutationObserver(applyTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });
    const wrapper = host.closest('[data-theme]');
    if (wrapper) observer.observe(wrapper, { attributes: true, attributeFilter: ['data-theme'] });
    return () => {
      observer.disconnect();
      created.dispose();
      stage.current = null;
    };
  }, [scene]);

  useEffect(() => stage.current?.setSpin(isSpinning), [isSpinning]);
  useEffect(() => {
    if (scene && stage.current) setSkipped(stage.current.setScene(scene, values));
  }, [scene, values]);

  /** The line under a saved image: the scene's title, `step` when there is one, and the slider values. */
  const caption = (step: string) => {
    const sliders = (scene?.sliders ?? [])
      .map((slider) => `${slider.label ?? slider.name} = ${formatGraphNumber(values[slider.name] ?? slider.value)}`)
      .join(', ');
    return [scene?.title ?? '3D scene', step, sliders].filter(Boolean).join('  ·  ');
  };

  /** The step a picture shows; a GIF of the steps shows them all, so its caption names none. */
  const stepCaption = stepLabels.length > 1 ? `Step ${steps.index + 1}: ${stepLabels[steps.index]}` : '';

  const prepareDownload = async (step: string): Promise<{ colours: IImageColours; footer: IImageFooter }> => {
    const theme = readTheme();
    const colours = { background: theme.background, foreground: theme.colours.foreground, muted: theme.line };
    const mark = await loadBrandMark(colours.background);
    return { colours, footer: { equation: null, caption: caption(step), mark } };
  };

  /** One download at a time; the buttons stay busy until it is saved, whatever happens. */
  const runDownload = async (kind: Exclude<Saving, null>, make: () => Promise<void>) => {
    if (saving || !stage.current) return;
    setSaving(kind);
    try {
      await make();
    } finally {
      setSaving(null);
    }
  };

  const downloadImage = () =>
    runDownload('image', async () => {
      const prepared = await prepareDownload(stepCaption);
      const blob = await stage.current?.snapshot(prepared.footer, prepared.colours);
      if (blob) saveBlob(blob, '3d-scene.png');
    });

  const downloadGif = () =>
    runDownload('gif', async () => {
      const current = stage.current;
      const width = stageRef.current?.clientWidth ?? 0;
      if (!current || !width) return;
      const { scale, textScale } = gifFrameScale(width);
      const prepared = await prepareDownload('');
      setGifProgress(0);
      // A scene with steps plays them; one without turns once round, as a graph does.
      const recording = stepLabels.length > 1 ? current.stepRecording() : turnRecording(current);
      const blob = await recordGif(recording, { ...prepared, scale, textScale }, setGifProgress);
      if (blob) saveBlob(blob, '3d-scene.gif');
    });

  const sliders = scene?.sliders ?? [];
  const later = [...new Set(skipped.map((type) => TYPE_NAMES[type] ?? type))];

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 text-foreground md:flex-row">
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="relative min-h-[55vh] flex-1 overflow-hidden border border-border bg-gradient-to-br from-muted via-background to-muted md:min-h-0">
          <div className="pointer-events-none absolute inset-0 bg-gradient-radial from-primary/10 via-transparent to-transparent" />
          <SceneThemeProbes probesRef={probesRef} />
          <div ref={stageRef} className="absolute inset-0" />
          <div ref={labelRef} className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true" />
          {isUnsupported || !scene ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center">
              <WarningCircleIcon weight="bold" className="h-6 w-6 text-muted-foreground" />
              <p className="max-w-sm text-sm text-muted-foreground">
                {scene
                  ? 'This device cannot draw 3D graphics, so the scene cannot be shown here.'
                  : `This scene cannot be shown: ${parsed.isValid ? '' : parsed.errors[0]}`}
              </p>
            </div>
          ) : (
            <>
              <StageToolbar
                isSpinning={isSpinning}
                onSpin={() => setIsSpinning(!isSpinning)}
                onReset={() => stage.current?.resetView()}
                onDownloadImage={() => void downloadImage()}
                onDownloadGif={() => void downloadGif()}
                saving={saving}
              />
              {saving === 'gif' ? <GifProgress fraction={gifProgress} /> : <Readout point={hover} />}
            </>
          )}
        </div>
        {scene && !isUnsupported && stepLabels.length > 1 ? (
          <StepBar
            labels={stepLabels}
            index={steps.index}
            onChange={steps.choose}
            isPlaying={steps.isPlaying}
            onTogglePlay={steps.togglePlay}
            isDisabled={saving === 'gif'}
          />
        ) : null}
      </div>

      <SceneSidebar
        sliders={sliders}
        values={values}
        onValue={(name, value) => setValues((current) => ({ ...current, [name]: value }))}
        onReset={() => scene && setValues(sceneSliderValues(scene))}
        later={later}
        stepLabels={stepLabels}
        stepIndex={steps.index}
        onStep={steps.choose}
      />
    </div>
  );
};

export default Scene3DViewer;
