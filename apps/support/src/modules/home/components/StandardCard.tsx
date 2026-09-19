import { type StandardDto } from '@repo/shared/contracts';
import { LogoTile } from '@components/app/attachments';
import { pluralize } from '@utils/helpers';

interface IProps {
  standard: StandardDto;
  subjectNames: string[];
  onOpen: (standard: StandardDto) => void;
}

/** One standard on the home page: its tile, name, alias and what it teaches. Click to edit. */
export const StandardCard = ({ standard, subjectNames, onOpen }: IProps) => (
  <button
    type="button"
    onClick={() => onOpen(standard)}
    className="group flex min-w-0 items-start gap-3 rounded-lg border border-border bg-background p-3 text-left transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
  >
    <LogoTile url={standard.logo} name={standard.name} size="lg" />
    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
      <span className="truncate text-sm font-semibold text-foreground">{standard.name}</span>
      {standard.alias ? <span className="truncate text-xs text-muted-foreground">{standard.alias}</span> : null}
      <span className="mt-1 line-clamp-2 text-xs text-muted-foreground">
        {subjectNames.length ? (
          <>
            <span className="font-semibold text-foreground">{pluralize(subjectNames.length, 'subject')}</span>
            {' · '}
            {subjectNames.join(', ')}
          </>
        ) : (
          'No subjects mapped yet'
        )}
      </span>
    </span>
  </button>
);
