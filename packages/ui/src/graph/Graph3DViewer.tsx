import {
  ArrowCounterClockwiseIcon,
  CrosshairIcon,
  GridFourIcon,
  PauseIcon,
  PlayIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react';
import {
  compileGraph,
  formatGraphNumber,
  type GraphParam,
  graphParamValues,
  parseGraphView,
  sampleGraph,
} from '@repo/shared/utils';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '../core/Button';
import { Chip } from '../core/Chip';
import { Slider } from '../core/Slider';
import { Tooltip } from '../core/Tooltip';
import { cn } from '../lib/cn';
import { DEFAULT_GRAPH_PALETTE, GRAPH_PALETTES, type IGraphPalette, paletteGradient } from './palettes';
import { GraphScene, type IGraphPoint } from './scene';

export interface IGraph3DViewerProps {
  /** The expression that is plotted. */
  graph: string;
  graphView: string | null;
}

/** Points per side of a surface grid; a curve takes six times as many points along its length. */
const GRID_SIZE = 80;

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xxs font-semibold uppercase tracking-caps text-muted-foreground">{children}</p>
);

/** Reads a token's colour off a hidden element, so the WebGL lines follow the page's theme. */
const readColour = (element: HTMLElement | null): string =>
  element ? getComputedStyle(element).color : 'rgb(128, 128, 128)';

interface IStageToolbarProps {
  isSpinning: boolean;
  onSpin: () => void;
  onReset: () => void;
}

const StageToolbar = ({ isSpinning, onSpin, onReset }: IStageToolbarProps) => (
  <div className="absolute right-3 top-3 flex items-center gap-1 border border-border bg-card/90 p-1 shadow-sm">
    <Tooltip title={isSpinning ? 'Stop turning' : 'Turn slowly'}>
      <Button
        isSubtle
        aria-label={isSpinning ? 'Stop turning' : 'Turn slowly'}
        aria-pressed={isSpinning}
        onClick={onSpin}
        className={cn('flex h-8 w-8 items-center justify-center p-0', isSpinning && 'text-primary')}
      >
        {isSpinning ? <PauseIcon weight="bold" className="h-4 w-4" /> : <PlayIcon weight="bold" className="h-4 w-4" />}
      </Button>
    </Tooltip>
    <Tooltip title="Reset view">
      <Button
        isSubtle
        aria-label="Reset view"
        onClick={onReset}
        className="flex h-8 w-8 items-center justify-center p-0"
      >
        <ArrowCounterClockwiseIcon weight="bold" className="h-4 w-4" />
      </Button>
    </Tooltip>
  </div>
);

const Readout = ({ point }: { point: IGraphPoint | null }) => (
  <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-2 border border-border bg-card/90 px-2.5 py-1.5 text-xs shadow-sm">
    {point ? (
      <>
        <CrosshairIcon weight="bold" className="h-3.5 w-3.5 text-primary" />
        <span className="font-mono tabular-nums">
          <span className="font-serif italic text-muted-foreground">x</span> {formatGraphNumber(point.x)}
          <span className="ml-2.5 font-serif italic text-muted-foreground">y</span> {formatGraphNumber(point.y)}
          <span className="ml-2.5 font-serif italic text-muted-foreground">z</span> {formatGraphNumber(point.z)}
        </span>
      </>
    ) : (
      <span className="text-muted-foreground">
        <span className="hidden md:inline">Drag to turn · scroll or pinch to zoom · point to read a value</span>
        <span className="md:hidden">Drag to turn · pinch to zoom · tap to read</span>
      </span>
    )}
  </div>
);

interface IPalettePickerProps {
  value: IGraphPalette;
  onChange: (palette: IGraphPalette) => void;
}

const PalettePicker = ({ value, onChange }: IPalettePickerProps) => (
  <div className="grid grid-cols-2 gap-2">
    {GRAPH_PALETTES.map((palette) => (
      <Button
        key={palette.id}
        isSecondary
        aria-pressed={palette.id === value.id}
        onClick={() => onChange(palette)}
        className={cn('flex flex-col items-stretch gap-1.5 p-2 text-left', palette.id === value.id && 'border-primary')}
      >
        <span className="block h-2.5 w-full" style={{ backgroundImage: paletteGradient(palette) }} />
        <span className="text-xs font-semibold">{palette.name}</span>
      </Button>
    ))}
  </div>
);

/**
 * The interactive 3D view of one equation: the graph on a canvas, with sliders for the parameters it
 * uses, a colour ramp to pick, and a read-out of the point under the pointer.
 *
 * Loaded on demand (see `GraphModal`), so three.js reaches a reader only when they open a graph.
 */
const Graph3DViewer = ({ graph, graphView }: IGraph3DViewerProps) => {
  const compiled = useMemo(() => compileGraph(graph), [graph]);
  const view = useMemo(() => parseGraphView(graphView), [graphView]);
  const [values, setValues] = useState<Record<GraphParam, number>>(() => graphParamValues(view));
  const [palette, setPalette] = useState(DEFAULT_GRAPH_PALETTE);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showWire, setShowWire] = useState(true);
  const [hover, setHover] = useState<IGraphPoint | null>(null);
  const [isUnsupported, setIsUnsupported] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const lineProbe = useRef<HTMLSpanElement>(null);
  const accentProbe = useRef<HTMLSpanElement>(null);
  const sceneRef = useRef<GraphScene | null>(null);

  // A teacher editing the view in the preview sees the sliders move back to the new defaults.
  useEffect(() => setValues(graphParamValues(view)), [view]);

  const sample = useMemo(
    () => (compiled.isValid ? sampleGraph(compiled.graph, view, values, GRID_SIZE) : null),
    [compiled, view, values],
  );

  useEffect(() => {
    const stage = stageRef.current;
    const labels = labelRef.current;
    if (!stage || !labels) return undefined;
    let scene: GraphScene;
    try {
      scene = new GraphScene(stage, labels, setHover);
    } catch {
      setIsUnsupported(true);
      return undefined;
    }
    sceneRef.current = scene;
    const applyTheme = () =>
      scene.setTheme({ line: readColour(lineProbe.current), accent: readColour(accentProbe.current) });
    applyTheme();
    // The apps switch theme on `<html>` and on a wrapper div; either change recolours the lines.
    const observer = new MutationObserver(applyTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });
    const wrapper = stage.closest('[data-theme]');
    if (wrapper) observer.observe(wrapper, { attributes: true, attributeFilter: ['data-theme'] });
    return () => {
      observer.disconnect();
      scene.dispose();
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => sceneRef.current?.setPalette(palette), [palette]);
  useEffect(() => sceneRef.current?.setWire(showWire), [showWire]);
  useEffect(() => sceneRef.current?.setSpin(isSpinning), [isSpinning]);
  useEffect(() => {
    if (sample) sceneRef.current?.setSample(sample);
  }, [sample]);

  const params = compiled.isValid ? compiled.graph.params : [];

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 text-foreground md:flex-row">
      <div className="relative min-h-[55vh] flex-1 overflow-hidden border border-border bg-gradient-to-br from-muted via-background to-muted md:min-h-0">
        <div className="pointer-events-none absolute inset-0 bg-gradient-radial from-primary/10 via-transparent to-transparent" />
        <span ref={lineProbe} className="hidden text-muted-foreground" aria-hidden="true" />
        <span ref={accentProbe} className="hidden text-primary" aria-hidden="true" />
        <div ref={stageRef} className="absolute inset-0" />
        <div ref={labelRef} className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true" />
        {isUnsupported || !compiled.isValid ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center">
            <WarningCircleIcon weight="bold" className="h-6 w-6 text-muted-foreground" />
            <p className="max-w-sm text-sm text-muted-foreground">
              {compiled.isValid
                ? 'This device cannot draw 3D graphics, so the graph cannot be shown here.'
                : `This graph cannot be drawn: ${compiled.message}`}
            </p>
          </div>
        ) : (
          <>
            <StageToolbar
              isSpinning={isSpinning}
              onSpin={() => setIsSpinning(!isSpinning)}
              onReset={() => sceneRef.current?.resetView()}
            />
            <Readout point={hover} />
          </>
        )}
      </div>

      <aside className="flex w-full shrink-0 flex-col gap-5 overflow-y-auto md:w-72">
        {params.length ? (
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <SectionTitle>Change the shape</SectionTitle>
              <Button
                isSubtle
                className="px-2 py-0.5 text-xs text-primary"
                onClick={() => setValues(graphParamValues(view))}
              >
                Reset
              </Button>
            </div>
            {params.map((param) => {
              const setting = view.params[param];
              return (
                <Slider
                  key={param}
                  label={<span className="font-serif text-sm italic">{param}</span>}
                  value={values[param]}
                  min={setting.min}
                  max={setting.max}
                  step={(setting.max - setting.min) / 200}
                  formatValue={formatGraphNumber}
                  onChange={(value) => setValues((current) => ({ ...current, [param]: value }))}
                />
              );
            })}
          </section>
        ) : null}

        <section className="flex flex-col gap-2">
          <SectionTitle>Colours</SectionTitle>
          <PalettePicker value={palette} onChange={setPalette} />
        </section>

        {compiled.isValid && compiled.graph.kind === 'surface' ? (
          <section className="flex flex-col gap-2">
            <SectionTitle>Display</SectionTitle>
            <div className="flex flex-wrap gap-2">
              <Chip
                label="Grid lines"
                isSelected={showWire}
                onClick={() => setShowWire(!showWire)}
                leftSection={<GridFourIcon weight="bold" className="h-3.5 w-3.5" />}
              />
            </div>
          </section>
        ) : null}
      </aside>
    </div>
  );
};

export default Graph3DViewer;
