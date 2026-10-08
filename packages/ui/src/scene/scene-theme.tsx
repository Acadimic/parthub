import type { SceneColour } from '@repo/shared/interfaces';
import { SCENE_COLOURS } from '@repo/shared/utils';
import type { RefObject } from 'react';
import type { SceneColours } from './scene-builder';
import type { ISceneTheme } from './scene-stage';
import { readColour } from '../three/viewer-parts';

/** The text colour class that carries each scene colour role, read off the page for the drawing. */
const ROLE_CLASSES: Record<SceneColour, string> = {
  primary: 'text-primary',
  foreground: 'text-foreground',
  muted: 'text-muted-foreground',
  'chart-1': 'text-chart-1',
  'chart-2': 'text-chart-2',
  'chart-3': 'text-chart-3',
  'chart-4': 'text-chart-4',
  'chart-5': 'text-chart-5',
};

const PROBE_CLASSES = [...Object.values(ROLE_CLASSES), 'text-background'];

/** Hidden spans in each colour a scene needs, so the drawing follows whichever theme holds them. */
export const SceneThemeProbes = ({ probesRef }: { probesRef: RefObject<HTMLDivElement | null> }) => (
  <div ref={probesRef} className="hidden" aria-hidden="true">
    {PROBE_CLASSES.map((className) => (
      <span key={className} data-probe={className} className={className} />
    ))}
  </div>
);

export interface ISceneThemeColours extends ISceneTheme {
  /** The page behind the scene, which a saved image is filled with. */
  background: string;
}

/** Every colour the drawing needs, read from the probes. */
export const readSceneTheme = (probes: HTMLElement | null): ISceneThemeColours => {
  const probe = (className: string) =>
    readColour(probes?.querySelector<HTMLElement>(`[data-probe="${className}"]`) ?? null);
  const colours = Object.fromEntries(SCENE_COLOURS.map((role) => [role, probe(ROLE_CLASSES[role])])) as SceneColours;
  return {
    colours,
    line: probe('text-muted-foreground'),
    accent: probe('text-primary'),
    background: probe('text-background'),
  };
};
