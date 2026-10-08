import { CubeIcon } from '@phosphor-icons/react';
import { type ISceneCatalogEntry, SCENE_CATALOG } from '@repo/shared/utils';

const GROUPS: ISceneCatalogEntry['group'][] = ['Mensuration', '3D geometry', 'Aptitude', 'Chemistry'];

/** The templates a new scene starts from, by subject; choosing one opens its form. */
export const SceneGallery = ({ onChoose }: { onChoose: (entry: ISceneCatalogEntry) => void }) => (
  <div className="flex flex-col gap-6">
    {GROUPS.map((group) => (
      <section key={group} className="flex flex-col gap-2">
        <h3 className="text-xxs font-semibold uppercase tracking-caps text-muted-foreground">{group}</h3>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {SCENE_CATALOG.filter((entry) => entry.group === group).map((entry) => (
            <button
              key={entry.key}
              type="button"
              onClick={() => onChoose(entry)}
              className="flex items-start gap-3 border border-border bg-card p-3 text-left transition-colors hover:border-primary hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-primary/10 text-primary">
                <CubeIcon weight="duotone" className="h-5 w-5" />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="text-sm font-semibold text-foreground">{entry.title}</span>
                <span className="text-xs text-muted-foreground">{entry.description}</span>
              </span>
            </button>
          ))}
        </div>
      </section>
    ))}
  </div>
);
