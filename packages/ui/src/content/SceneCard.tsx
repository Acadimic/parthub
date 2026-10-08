import { CubeIcon } from '@phosphor-icons/react';
import type { IScene } from '@repo/shared/interfaces';
import { parseScene } from '@repo/shared/utils';
import { lazy, type ReactNode, Suspense, useMemo, useState } from 'react';
import { useIsPrint } from '../contexts/print-context';
import { Button } from '../core/Button';
import { cn } from '../lib/cn';
import { Viewer3DModal } from './Viewer3DModal';

/** Three.js and the scene viewer arrive as their own chunk, fetched the first time a scene is opened. */
const loadSceneViewer = () => import('../graph/Scene3DViewer');
const Scene3DViewer = lazy(loadSceneViewer);
const ScenePrintStill = lazy(() => import('../graph/ScenePrintStill'));

/** Starts the download early — on hover or focus — so the scene is usually ready by the click. */
export const preloadSceneViewer = (): void => {
  void loadSceneViewer();
};

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;

/** What the reader can do with the scene: "Turn it and zoom in · move the slider · follow 3 steps". */
const sceneDetail = (scene: IScene): string => {
  const sliders = scene.sliders?.length ?? 0;
  const steps = scene.steps?.length ?? 0;
  return [
    'Turn it and zoom in',
    sliders ? `move ${sliders === 1 ? 'the slider' : `the ${plural(sliders, 'slider')}`}` : '',
    steps ? `follow ${plural(steps, 'step')}` : '',
  ]
    .filter(Boolean)
    .join(' · ');
};

/** On paper: the title, then the scene as a picture, kept together on one page. */
const PrintedScene = ({
  spec,
  title,
  isValid,
  className,
}: {
  spec: string;
  title: string;
  isValid: boolean;
  className?: string;
}) => (
  <div className={cn('my-4 break-inside-avoid border border-border p-3', className)}>
    <div className="flex items-center gap-2 font-semibold text-foreground">
      <CubeIcon weight="duotone" className="h-5 w-5 shrink-0 text-primary" />
      {title}
    </div>
    {isValid ? (
      <Suspense fallback={<div className="mt-3 h-48 w-full bg-muted" data-pending="" />}>
        <ScenePrintStill spec={spec} title={title} />
      </Suspense>
    ) : null}
  </div>
);

export interface ISceneCardProps {
  /** The scene's JSON, as stored on the `scene3d` node. */
  spec: string;
  className?: string;
  /** More buttons beside "Open in 3D": the editor adds Edit. */
  actions?: ReactNode;
}

/**
 * A 3D scene in the flow of a lesson, question or solution: a card with its title and what the
 * reader can do, and a button that opens it in the 3D popup. Nothing three.js loads until then.
 */
export const SceneCard = ({ spec, className, actions }: ISceneCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const isPrint = useIsPrint();
  const parsed = useMemo(() => parseScene(spec), [spec]);
  const scene = parsed.isValid ? parsed.scene : null;
  const title = scene?.title ?? '3D scene';
  const detail = scene ? sceneDetail(scene) : '';
  if (isPrint) return <PrintedScene spec={spec} title={title} isValid={!!scene} className={className} />;

  return (
    <div
      className={cn('my-4 flex items-center gap-3 border border-border bg-card p-3', className)}
      // A scene inside a clickable card or question: opening it must not also act on what holds it.
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-primary/10 text-primary">
        <CubeIcon weight="duotone" className="h-6 w-6" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="font-semibold text-foreground">{title}</span>
        <span className="text-xs text-muted-foreground">{scene ? detail : 'This 3D scene cannot be shown.'}</span>
      </div>
      {scene ? (
        <Button
          onClick={() => setIsOpen(true)}
          onPointerEnter={preloadSceneViewer}
          onFocus={preloadSceneViewer}
          className="shrink-0 px-3 py-1.5 text-sm print:hidden"
          leftSection={<CubeIcon weight="bold" className="h-4 w-4" />}
          text="Open in 3D"
        />
      ) : null}
      {actions}
      <Viewer3DModal
        title="3D scene"
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        loadingText="Loading the 3D scene…"
        summary={
          <>
            <span className="truncate text-base font-semibold">{title}</span>
            <span className="truncate text-xs text-muted-foreground">{detail}</span>
          </>
        }
      >
        <Scene3DViewer spec={spec} autoPlay />
      </Viewer3DModal>
    </div>
  );
};
