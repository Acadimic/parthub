import { useId } from 'react';

export const PointerSvg = () => {
  // The pattern id was a literal ":R55im:" — a React-generated id that had been pasted in, so two
  // of these on one page referenced the same <pattern>. `useId` keeps it unique per instance.
  const patternId = useId();

  return (
    <div className="text-foreground">
      <svg
        fill="currentColor"
        stroke="currentColor"
        aria-hidden="true"
        className="opacity-20 pointer-events-none absolute inset-0 h-full w-full [mask-image:linear-gradient(to_bottom,white,transparent,transparent)]"
      >
        <defs>
          <pattern
            id={patternId}
            width="15"
            height="15"
            patternUnits="userSpaceOnUse"
            patternContentUnits="userSpaceOnUse"
            x="0"
            y="0"
          >
            <circle cx="1" cy="1" r="1"></circle>
          </pattern>
        </defs>
        <rect width="100%" height="100%" strokeWidth={0} fill={`url(#${patternId})`}></rect>
      </svg>
    </div>
  );
};
