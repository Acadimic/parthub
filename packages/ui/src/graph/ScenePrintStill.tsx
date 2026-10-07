import { formatGraphNumber, parseScene, sceneSliderValues } from '@repo/shared/utils';
import { useEffect, useRef, useState } from 'react';
import { SceneStage } from './scene-stage';
import { readSceneTheme, SceneThemeProbes } from './scene-theme';

export interface IScenePrintStillProps {
  spec: string;
  title: string;
}

/** The size the still is drawn at, in CSS pixels; the printout scales it to the column. */
const WIDTH = 640;
const HEIGHT = 420;

/**
 * A 3D scene as a picture for a printout: drawn once, off screen, at its starting slider values,
 * then the WebGL context is released. Until the picture exists the frame is marked `data-pending`,
 * which is what holds the print dialog back.
 */
const ScenePrintStill = ({ spec, title }: IScenePrintStillProps) => {
  const [url, setUrl] = useState('');
  const [isDone, setIsDone] = useState(false);
  const hostRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const probesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const labels = labelRef.current;
    const parsed = parseScene(spec);
    if (!host || !labels || !parsed.isValid) {
      setIsDone(true);
      return undefined;
    }
    let isCurrent = true;
    let made = '';
    let stage: SceneStage | null = null;
    const { scene } = parsed;
    const values = sceneSliderValues(scene);
    try {
      stage = new SceneStage(host, labels, () => undefined);
      const theme = readSceneTheme(probesRef.current);
      stage.setTheme(theme);
      stage.setScene(scene, values);
      const caption = (scene.sliders ?? [])
        .map((slider) => `${slider.label ?? slider.name} = ${formatGraphNumber(values[slider.name] ?? slider.value)}`)
        .join(', ');
      void stage
        .snapshot(
          { equation: null, caption, mark: null },
          {
            background: theme.background,
            foreground: theme.colours.foreground,
            muted: theme.line,
          },
        )
        .then((blob) => {
          if (!isCurrent) return;
          if (blob) {
            made = URL.createObjectURL(blob);
            setUrl(made);
          }
          setIsDone(true);
        })
        .finally(() => stage?.dispose());
    } catch {
      // No WebGL here: the card prints without a picture rather than holding the printout back.
      stage?.dispose();
      setIsDone(true);
    }
    return () => {
      isCurrent = false;
      if (made) URL.revokeObjectURL(made);
    };
  }, [spec]);

  return (
    <>
      <SceneThemeProbes probesRef={probesRef} />
      {url ? <img src={url} alt={title} className="mx-auto mt-3 block w-full max-w-[32rem]" /> : null}
      {!url && !isDone ? <div className="mt-3 h-48 w-full animate-pulse bg-muted" data-pending="" /> : null}
      <div
        className="pointer-events-none fixed -left-[10000px] top-0 print:hidden"
        style={{ width: WIDTH, height: HEIGHT }}
        aria-hidden="true"
      >
        <div ref={hostRef} className="absolute inset-0" />
        <div ref={labelRef} className="absolute inset-0 overflow-hidden" />
      </div>
    </>
  );
};

export default ScenePrintStill;
