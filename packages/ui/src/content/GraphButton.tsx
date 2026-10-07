import { ArrowsInIcon, ArrowsOutIcon, CubeIcon } from '@phosphor-icons/react';
import { compileGraph, formatGraphNumber, type IGraphAttrs, parseGraphView } from '@repo/shared/utils';
import { lazy, Suspense, useState } from 'react';
import { Button } from '../core/Button';
import { Modal } from '../core/Modal';
import { useCloseOnBack } from '../hooks/use-close-on-back.hook';
import { Spinner } from '../core/Spinner';
import { Tooltip } from '../core/Tooltip';
import { cn } from '../lib/cn';
import { MathRender } from './MathRender';

/** Three.js and the viewer arrive as their own chunk, fetched the first time a graph is opened. */
const loadViewer = () => import('../graph/Graph3DViewer');
const Graph3DViewer = lazy(loadViewer);

/** Starts the download early — on hover or focus — so the graph is usually ready by the click. */
export const preloadGraphViewer = (): void => {
  void loadViewer();
};

/** The id the equation editor checks so a click inside the popup does not close it. */
export const GRAPH_MODAL_ID = 'graph-3d-modal';

/** "Surface over x from −4 to 4 and y from −4 to 4", the line under the equation. */
const describeGraph = ({ graph, graphView }: IGraphAttrs): string => {
  const compiled = compileGraph(graph);
  if (!compiled.isValid) return '3D graph';
  const view = parseGraphView(graphView);
  const range = (axis: 'x' | 'y' | 't') =>
    `${axis} from ${formatGraphNumber(view[axis].min)} to ${formatGraphNumber(view[axis].max)}`;
  return compiled.graph.kind === 'surface'
    ? `3D surface over ${range('x')} and ${range('y')}`
    : `3D curve for ${range('t')}`;
};

export interface IGraphModalProps extends IGraphAttrs {
  latex: string;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * The 3D graph of one equation in a centred popup: the graph fills the body, and the footer carries
 * the typeset equation and, on larger screens, a full-screen toggle. It closes on the close button, Escape,
 * a click on the dimmed page, and the back button.
 *
 * Events are stopped at its root: React bubbles a portal's events through the component tree, so a
 * click on a slider would otherwise reach whatever holds the equation — an answer option would be
 * selected by it.
 */
export const GraphModal = ({ latex, graph, graphView, isOpen, onClose }: IGraphModalProps) => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  // On a phone the back gesture is how a full-screen view is left; it closes the popup, not the page.
  useCloseOnBack(isOpen, onClose);
  const toggleLabel = isFullScreen ? 'Exit full screen' : 'Full screen';
  return (
    <Modal
      id={GRAPH_MODAL_ID}
      position="center"
      isOpen={isOpen}
      onClose={onClose}
      className={cn(
        'h-[100dvh] w-screen max-w-none border-0',
        !isFullScreen && 'md:h-[min(860px,92vh)] md:w-[min(1280px,94vw)] md:border md:shadow-2xl',
      )}
      childrenClassName="min-h-0 p-3 md:p-4"
      title="3D graph"
      footer={
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-primary/10 text-primary">
            <CubeIcon weight="duotone" className="h-5 w-5" />
          </span>
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="overflow-x-auto text-base">
              <MathRender latex={latex} />
            </div>
            <span className="truncate text-xs text-muted-foreground">{describeGraph({ graph, graphView })}</span>
          </div>
          <Tooltip title={toggleLabel}>
            <Button
              isSubtle
              aria-label={toggleLabel}
              aria-pressed={isFullScreen}
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="hidden h-9 w-9 items-center justify-center p-0 md:flex"
            >
              {isFullScreen ? (
                <ArrowsInIcon weight="bold" className="h-5 w-5" />
              ) : (
                <ArrowsOutIcon weight="bold" className="h-5 w-5" />
              )}
            </Button>
          </Tooltip>
        </div>
      }
    >
      <div
        className="h-full"
        onClick={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        {isOpen ? (
          <Suspense
            fallback={
              <div className="flex h-full min-h-[55vh] items-center justify-center gap-2 text-sm text-muted-foreground">
                <Spinner size="sm" /> Loading the 3D graph…
              </div>
            }
          >
            <Graph3DViewer graph={graph} graphView={graphView} />
          </Suspense>
        ) : null}
      </div>
    </Modal>
  );
};

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
