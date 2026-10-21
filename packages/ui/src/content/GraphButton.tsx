import { ArrowsOutIcon, CubeIcon } from '@phosphor-icons/react';
import { compileGraph, formatGraphNumber, GRAPH_KIND_AXES, type IGraphAttrs, parseGraphView } from '@repo/shared/utils';
import { lazy, Suspense, useRef, useState } from 'react';
import { useIsPrint } from '../contexts/print-context';
import { Button } from '../core/Button';
import { Tooltip } from '../core/Tooltip';
import { cn } from '../lib/cn';
import { INLINE_MIN_WIDTH, InlinePlaceholder, useIsNearViewport, useWidth } from './inline-3d';
import { MathRender } from './MathRender';
import { Viewer3DModal } from './Viewer3DModal';

/** Three.js and the viewer arrive as their own chunk, fetched the first time a graph is opened. */
const loadViewer = () => import('../graph/Graph3DViewer');
const Graph3DViewer = lazy(loadViewer);

/** Starts the download early — on hover or focus — so the graph is usually ready by the click. */
export const preloadGraphViewer = (): void => {
  void loadViewer();
};

/** "Surface over x from −4 to 4 and y from −4 to 4", the line under the equation. */
const describeGraph = ({ graph, graphView }: IGraphAttrs): string => {
  const compiled = compileGraph(graph);
  if (!compiled.isValid) return '3D graph';
  const view = parseGraphView(graphView);
  const { kind } = compiled.graph;
  const ranges = GRAPH_KIND_AXES[kind]
    .map((axis) => `${axis} from ${formatGraphNumber(view[axis].min)} to ${formatGraphNumber(view[axis].max)}`)
    .join(' and ');
  const shape = { surface: '3D surface over', curve: '3D curve for', parametric: '3D surface for' }[kind];
  return `${shape} ${ranges}`;
};

export interface IGraphModalProps extends IGraphAttrs {
  latex: string;
  isOpen: boolean;
  onClose: () => void;
}

/** The 3D graph of one equation in the shared 3D popup, with the typeset equation in its footer. */
export const GraphModal = ({ latex, graph, graphView, isOpen, onClose }: IGraphModalProps) => (
  <Viewer3DModal
    title="3D graph"
    isOpen={isOpen}
    onClose={onClose}
    loadingText="Loading the 3D graph…"
    summary={
      <>
        <div className="overflow-x-auto text-base">
          <MathRender latex={latex} />
        </div>
        <span className="truncate text-xs text-muted-foreground">{describeGraph({ graph, graphView })}</span>
      </>
    }
  >
    <Graph3DViewer latex={latex} graph={graph} graphView={graphView} layout="fill" />
  </Viewer3DModal>
);

export interface IGraphButtonProps extends IGraphAttrs {
  latex: string;
  className?: string;
}

/**
 * The cube beside an equation that has a 3D graph. Hidden in print, where WebGL cannot go.
 */
export const GraphButton = ({ latex, graph, graphView, className }: IGraphButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <span
      className={cn('inline-flex align-middle print:hidden', className)}
      // An equation inside an answer option or a clickable card: opening the graph must not also
      // select the option or follow the card.
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <Tooltip title="View in 3D">
        <Button
          isSubtle
          isRound
          aria-label="Open the 3D graph of this equation"
          onClick={() => setIsOpen(true)}
          onPointerEnter={preloadGraphViewer}
          onFocus={preloadGraphViewer}
          className="-my-1 flex h-8 w-8 items-center justify-center p-0 text-primary hover:bg-primary/10"
        >
          <CubeIcon weight="duotone" className="h-5 w-5" />
        </Button>
      </Tooltip>
      <GraphModal latex={latex} graph={graph} graphView={graphView} isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </span>
  );
};

export interface IGraphBlockProps extends IGraphAttrs {
  latex: string;
}

/**
 * An equation's 3D graph in the flow of the content, under the equation or the paragraph that holds
 * it: the graph itself and a full-screen button, whose popup carries the sliders, colours and
 * downloads. It is drawn only while near the screen; narrower than a lesson column (a two-up answer
 * option) it is the cube button instead, and it is left out of print, where WebGL cannot go.
 */
export const GraphBlock = ({ latex, graph, graphView }: IGraphBlockProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const isPrint = useIsPrint();
  const rootRef = useRef<HTMLDivElement>(null);
  const isNear = useIsNearViewport(rootRef);
  const width = useWidth(rootRef);
  if (isPrint) return null;
  // Unmeasured counts as wide, so a lesson does not flash the button before the graph.
  const isInline = width === 0 || width >= INLINE_MIN_WIDTH;
  return (
    <div
      ref={rootRef}
      className="my-4"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      {isInline ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <CubeIcon weight="duotone" className="h-5 w-5 shrink-0 text-primary" />
            <div className="min-w-0 flex-1 overflow-x-auto text-sm">
              <MathRender latex={latex} />
            </div>
            <Tooltip title="Full screen: turn, zoom, sliders and downloads">
              <Button
                isSubtle
                aria-label="Open the 3D graph in full screen"
                onClick={() => setIsOpen(true)}
                className="flex h-8 w-8 shrink-0 items-center justify-center p-0"
              >
                <ArrowsOutIcon weight="bold" className="h-5 w-5" />
              </Button>
            </Tooltip>
          </div>
          {/* One live view at a time: the inline one stands aside while the popup is open. */}
          {isNear && !isOpen ? (
            <Suspense fallback={<InlinePlaceholder loadingText="Loading the 3D graph…" />}>
              <Graph3DViewer latex={latex} graph={graph} graphView={graphView} layout="inline" />
            </Suspense>
          ) : (
            <InlinePlaceholder loadingText={null} />
          )}
          <GraphModal
            latex={latex}
            graph={graph}
            graphView={graphView}
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
          />
        </div>
      ) : (
        <GraphButton latex={latex} graph={graph} graphView={graphView} />
      )}
    </div>
  );
};
