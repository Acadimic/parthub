import { GridFourIcon, WarningCircleIcon } from '@phosphor-icons/react';
import {
  compileGraph,
  formatGraphNumber,
  GRAPH_KIND_AXES,
  GRAPH_KIND_LEFT_SIDE,
  type GraphKind,
  type GraphParam,
  graphParamValues,
  type IGraphView,
  parseGraphView,
  sampleGraph,
} from '@repo/shared/utils';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '../core/Button';
import { Chip } from '../core/Chip';
import { Slider } from '../core/Slider';
import { cn } from '../lib/cn';
import { GifProgress, Readout, readColour, type Saving, SectionTitle, StageToolbar } from './viewer-parts';
import { DEFAULT_GRAPH_PALETTE, GRAPH_PALETTES, type IGraphPalette, paletteGradient } from './palettes';
import { GraphScene, type IGraphPoint } from './scene';
import { loadBrandMark } from './brand';
import { renderEquationImage } from './equation-image';
import { gifFrameScale, recordGraphGif } from './gif';
import { type IGraphImageColours, type IGraphImageFooter, saveBlob } from './snapshot';

export interface IGraph3DViewerProps {
  /** The equation as written, typeset into a downloaded image. */
  latex: string;
  /** The expression that is plotted. */
  graph: string;
  graphView: string | null;
}

/** Points per side of a surface grid; a curve takes six times as many points along its length. */
const GRID_SIZE = 80;

/** The plotted expression as a caption line, `z = a*(x^2 - y^2)`, for when no typeset equation is available. */
const imageExpression = (graph: string, kind: GraphKind): string =>
  `${GRAPH_KIND_LEFT_SIDE[kind]} = ${graph.trim().replace(/^(z|r\s*\(\s*(t|u\s*,\s*v)\s*\))\s*=\s*/i, '')}`;

/** The ranges and the slider values a saved image was taken at: "x from -2 to 2, y from -2 to 2  ·  a = 1.5". */
const imageDetails = (kind: GraphKind, view: IGraphView, values: Partial<Record<GraphParam, number>>): string => {
  const range = (axis: 'x' | 'y' | 't' | 'u' | 'v') =>
    `${axis} from ${formatGraphNumber(view[axis].min)} to ${formatGraphNumber(view[axis].max)}`;
  const sliders = Object.entries(values)
    .map(([param, value]) => `${param} = ${formatGraphNumber(value ?? 0)}`)
    .join(', ');
  return [GRAPH_KIND_AXES[kind].map(range).join(', '), sliders].filter(Boolean).join('  ·  ');
};

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
const Graph3DViewer = ({ latex, graph, graphView }: IGraph3DViewerProps) => {
  const compiled = useMemo(() => compileGraph(graph), [graph]);
  const view = useMemo(() => parseGraphView(graphView), [graphView]);
  const [values, setValues] = useState<Record<GraphParam, number>>(() => graphParamValues(view));
  const [palette, setPalette] = useState(DEFAULT_GRAPH_PALETTE);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showWire, setShowWire] = useState(true);
  const [hover, setHover] = useState<IGraphPoint | null>(null);
  const [isUnsupported, setIsUnsupported] = useState(false);
  const [saving, setSaving] = useState<Saving>(null);
  const [gifProgress, setGifProgress] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const lineProbe = useRef<HTMLSpanElement>(null);
  const accentProbe = useRef<HTMLSpanElement>(null);
  const backgroundProbe = useRef<HTMLSpanElement>(null);
  const foregroundProbe = useRef<HTMLSpanElement>(null);
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

  /** The colours and the line under the graph a download is drawn with, at `pixelRatio`. */
  const prepareDownload = async (
    pixelRatio: number,
  ): Promise<{ colours: IGraphImageColours; footer: IGraphImageFooter } | null> => {
    if (!compiled.isValid) return null;
    const { kind } = compiled.graph;
    const used = Object.fromEntries(params.map((param) => [param, values[param]]));
    const colours = {
      background: readColour(backgroundProbe.current),
      foreground: readColour(foregroundProbe.current),
      muted: readColour(lineProbe.current),
    };
    const [equation, mark] = await Promise.all([
      renderEquationImage(latex, colours.foreground, pixelRatio),
      loadBrandMark(colours.background),
    ]);
    const details = imageDetails(kind, view, used);
    const caption = equation ? details : `${imageExpression(graph, kind)}  ·  ${details}`;
    return { colours, footer: { equation, caption, mark } };
  };

  /**
   * Runs one download with the buttons held busy, so a second click cannot start another meanwhile
   * (the first one waits for the equation's fonts), and frees them whatever happens.
   */
  const runDownload = async (kind: Exclude<Saving, null>, make: () => Promise<void>) => {
    if (saving || !sceneRef.current) return;
    setSaving(kind);
    try {
      await make();
    } finally {
      setSaving(null);
    }
  };

  const downloadImage = () =>
    runDownload('image', async () => {
      // The same pixel ratio the 3D canvas is drawn at, so the equation is as sharp as the graph.
      const prepared = await prepareDownload(Math.min(window.devicePixelRatio || 1, 2));
      const blob = prepared ? await sceneRef.current?.snapshot(prepared.footer, prepared.colours) : null;
      if (blob) saveBlob(blob, '3d-graph.png');
    });

  const downloadGif = () =>
    runDownload('gif', async () => {
      const scene = sceneRef.current;
      const width = stageRef.current?.clientWidth ?? 0;
      if (!scene || !width) return;
      const { scale, textScale } = gifFrameScale(width);
      const prepared = await prepareDownload(textScale);
      if (!prepared) return;
      setGifProgress(0);
      const blob = await recordGraphGif(scene, { ...prepared, scale, textScale }, setGifProgress);
      if (blob) saveBlob(blob, '3d-graph.gif');
    });

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 text-foreground md:flex-row">
      <div className="relative min-h-[55vh] flex-1 overflow-hidden border border-border bg-gradient-to-br from-muted via-background to-muted md:min-h-0">
        <div className="pointer-events-none absolute inset-0 bg-gradient-radial from-primary/10 via-transparent to-transparent" />
        <span ref={lineProbe} className="hidden text-muted-foreground" aria-hidden="true" />
        <span ref={accentProbe} className="hidden text-primary" aria-hidden="true" />
        <span ref={backgroundProbe} className="hidden text-background" aria-hidden="true" />
        <span ref={foregroundProbe} className="hidden text-foreground" aria-hidden="true" />
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
              onDownloadImage={() => void downloadImage()}
              onDownloadGif={() => void downloadGif()}
              saving={saving}
            />
            {saving === 'gif' ? <GifProgress fraction={gifProgress} /> : <Readout point={hover} />}
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

        {compiled.isValid && compiled.graph.kind !== 'curve' ? (
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
