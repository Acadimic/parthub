export const PointerSvg = () => {
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
            id=":R55im:"
            width="15"
            height="15"
            patternUnits="userSpaceOnUse"
            patternContentUnits="userSpaceOnUse"
            x="0"
            y="0"
          >
            <circle id="pattern-circle" cx="1" cy="1" r="1"></circle>
          </pattern>
        </defs>
        <rect width="100%" height="100%" stroke-width="0" fill="url(#:R55im:)"></rect>
      </svg>
    </div>
  );
};
