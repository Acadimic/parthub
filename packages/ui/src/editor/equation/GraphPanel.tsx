import { CubeIcon, MagicWandIcon, SlidersHorizontalIcon, TrashIcon } from '@phosphor-icons/react';
import {
  compileGraph,
  formatGraphNumber,
  formatGraphView,
  type GraphKind,
  type GraphParam,
  graphExpressionFromLatex,
  type IGraphAttrs,
  type IGraphView,
  parseGraphView,
  validateGraph,
} from '@repo/shared/utils';
import { useEffect, useMemo, useState } from 'react';
import { GraphModal, preloadGraphViewer } from '../../content/GraphButton';
import { Button } from '../../core/Button';
import { TextInput } from '../../core/TextInput';
import { cn } from '../../lib/cn';
import { PanelButton } from './panel-controls';

export interface IGraphPanelProps {
  latex: string;
  graph: IGraphAttrs | null;
  /** Called only with an expression that compiles and draws, or with null to remove the graph. */
  onChange: (graph: IGraphAttrs | null) => void;
}

type FieldKey = `${'x' | 'y' | 't'}.${'min' | 'max'}` | `${GraphParam}.${'value' | 'min' | 'max'}`;
type Fields = Partial<Record<FieldKey, string>>;

const ICON = 'h-4 w-4';

const fieldsFromView = (view: IGraphView): Fields => {
  const fields: Fields = {};
  (['x', 'y', 't'] as const).forEach((axis) => {
    fields[`${axis}.min`] = formatGraphNumber(view[axis].min);
    fields[`${axis}.max`] = formatGraphNumber(view[axis].max);
  });
  (['a', 'b', 'c'] as const).forEach((param) => {
    fields[`${param}.value`] = formatGraphNumber(view.params[param].value);
    fields[`${param}.min`] = formatGraphNumber(view.params[param].min);
    fields[`${param}.max`] = formatGraphNumber(view.params[param].max);
  });
  return fields;
};

/**
 * Fields → a stored `graphView`. Written out and read back through the shared parser, so a field
 * that does not hold a number (or `2pi`) falls back to its default rather than reaching the document.
 */
const viewFromFields = (fields: Fields): string | null => {
  const value = (key: FieldKey) => (fields[key] ?? '').replace(/\s+/g, '');
  const raw = [
    ...(['x', 'y', 't'] as const).map((axis) => `${axis}=${value(`${axis}.min`)}..${value(`${axis}.max`)}`),
    ...(['a', 'b', 'c'] as const).map(
      (param) => `${param}=${value(`${param}.value`)}[${value(`${param}.min`)}..${value(`${param}.max`)}]`,
    ),
  ].join(' ');
  return formatGraphView(parseGraphView(raw));
};

const describe = (kind: GraphKind, params: GraphParam[]): string => {
  const shape = kind === 'surface' ? 'A surface over x and y' : 'A curve along t';
  return params.length ? `${shape}, with sliders for ${params.join(', ')}.` : `${shape}.`;
};

interface IFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

const Field = ({ label, value, onChange }: IFieldProps) => (
  <TextInput
    aria-label={label}
    title={label}
    value={value}
    onChange={(event) => onChange(event.target.value)}
    inputClassName="font-mono text-xs"
    className="min-w-0"
  />
);

interface IViewFieldsProps {
  kind: GraphKind;
  params: GraphParam[];
  fields: Fields;
  onChange: (key: FieldKey, value: string) => void;
}

/** Ranges and slider limits, laid out as sentences: "x from −4 to 4", "a starts at 1, from 0.1 to 3". */
const ViewFields = ({ kind, params, fields, onChange }: IViewFieldsProps) => {
  const axes = kind === 'surface' ? (['x', 'y'] as const) : (['t'] as const);
  const cell = (key: FieldKey, label: string) => (
    <Field label={label} value={fields[key] ?? ''} onChange={(value) => onChange(key, value)} />
  );
  return (
    <div className="grid grid-cols-[2.5rem_repeat(3,minmax(0,1fr))] items-center gap-x-2 gap-y-1.5 text-xs">
      <span />
      <span className="text-xxs text-muted-foreground">starts at</span>
      <span className="text-xxs text-muted-foreground">from</span>
      <span className="text-xxs text-muted-foreground">to</span>
      {axes.map((axis) => (
        <div key={axis} className="contents">
          <span className="font-serif text-sm italic">{axis}</span>
          <span className="text-xxs text-muted-foreground">—</span>
          {cell(`${axis}.min`, `${axis} from`)}
          {cell(`${axis}.max`, `${axis} to`)}
        </div>
      ))}
      {params.map((param) => (
        <div key={param} className="contents">
          <span className="font-serif text-sm italic">{param}</span>
          {cell(`${param}.value`, `${param} starts at`)}
          {cell(`${param}.min`, `${param} slider from`)}
          {cell(`${param}.max`, `${param} slider to`)}
        </div>
      ))}
    </div>
  );
};

/**
 * The 3D graph section of the equation editor. The expression starts filled in from the equation
 * where that converts cleanly; only an expression that draws reaches the document, so a half-typed
 * one leaves the last good graph in place.
 */
export const GraphPanel = ({ latex, graph, onChange }: IGraphPanelProps) => {
  const [draft, setDraft] = useState(() => graph?.graph ?? graphExpressionFromLatex(latex) ?? '');
  // Null until a field is edited: the stored view is kept as written (`t=0..4pi` stays that) unless
  // the teacher changes it.
  const [editedFields, setEditedFields] = useState<Fields | null>(null);
  const [isAdjusting, setIsAdjusting] = useState(!!graph?.graphView);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const storedView = graph?.graphView ?? null;
  const fields = useMemo(() => editedFields ?? fieldsFromView(parseGraphView(storedView)), [editedFields, storedView]);
  const graphView = useMemo(
    () => (editedFields ? viewFromFields(editedFields) : storedView),
    [editedFields, storedView],
  );
  const result = useMemo(() => validateGraph(draft, graphView), [draft, graphView]);
  const kind = useMemo(() => {
    const compiled = compileGraph(draft);
    return compiled.isValid ? compiled.graph.kind : 'surface';
  }, [draft]);
  const fromLatex = useMemo(() => graphExpressionFromLatex(latex), [latex]);

  useEffect(() => {
    if (!result.isValid) return;
    const next = draft.trim();
    if (next !== graph?.graph || graphView !== graph?.graphView) onChange({ graph: next, graphView });
    // Only a change to what is typed should write; `graph` and `onChange` are the write's own echo.
  }, [result, draft, graphView]);

  return (
    <div className="flex flex-col gap-2 border-t border-border bg-muted/30 p-2">
      <div className="flex items-center gap-1.5">
        <CubeIcon weight="duotone" className={cn(ICON, 'text-primary')} />
        <span className="flex-1 text-xxs font-semibold uppercase tracking-caps text-muted-foreground">3D graph</span>
        <Button
          isSecondary
          disabled={!result.isValid}
          onClick={() => setIsPreviewing(true)}
          onPointerEnter={preloadGraphViewer}
          className="h-7 px-2 text-xs"
          leftSection={<CubeIcon weight="bold" className="h-3.5 w-3.5" />}
          text="Preview"
        />
        <PanelButton label="Remove 3D graph" onClick={() => onChange(null)} isDanger>
          <TrashIcon className={ICON} />
        </PanelButton>
      </div>

      <TextInput
        aria-label="Expression to plot"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder={kind === 'curve' ? '(cos(t), sin(t), t/4)' : 'a*(x^2 - y^2)'}
        inputClassName="font-mono text-xs"
        error={!result.isValid}
        leftSection={
          <span className="whitespace-nowrap pl-1 font-mono text-xs text-muted-foreground">
            {kind === 'curve' ? 'r(t) =' : 'z ='}
          </span>
        }
      />
      <p className={cn('text-xxs', result.isValid ? 'text-muted-foreground' : 'text-destructive')}>
        {result.isValid
          ? describe(result.graph.kind, result.graph.params)
          : `${result.message} The graph keeps its last working version until this one can be drawn.`}
      </p>

      <div className="flex flex-wrap items-center gap-1">
        <Button
          isSubtle
          disabled={!fromLatex || fromLatex === draft}
          onClick={() => fromLatex && setDraft(fromLatex)}
          className="h-7 px-2 text-xs"
          leftSection={<MagicWandIcon weight="bold" className="h-3.5 w-3.5" />}
          text="Fill from equation"
        />
        <Button
          isSubtle
          aria-pressed={isAdjusting}
          onClick={() => setIsAdjusting(!isAdjusting)}
          className={cn('h-7 px-2 text-xs', isAdjusting && 'text-primary')}
          leftSection={<SlidersHorizontalIcon weight="bold" className="h-3.5 w-3.5" />}
          text="Adjust view"
        />
        <span className="ml-auto hidden text-xxs text-muted-foreground sm:block">
          x, y or t · sliders a, b, c · sin, sqrt, exp, log, pi
        </span>
      </div>

      {isAdjusting ? (
        <ViewFields
          kind={kind}
          params={result.isValid ? result.graph.params : []}
          fields={fields}
          onChange={(key, value) => setEditedFields({ ...fields, [key]: value })}
        />
      ) : null}

      {graph ? (
        <GraphModal
          latex={latex}
          graph={graph.graph}
          graphView={graph.graphView}
          isOpen={isPreviewing}
          onClose={() => setIsPreviewing(false)}
        />
      ) : null}
    </div>
  );
};
