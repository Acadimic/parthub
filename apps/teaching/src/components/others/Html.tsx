import { getBlocks, serializeBlocks } from '@components/editors/math-jax-editor/util';

export const Html = ({ html, prefix }: { html: string; prefix?: string }): React.ReactNode => {
  const blocks = getBlocks(html);
  return (
    <>
      <div className="text-sm font-medium text-foreground !border-border">
        {prefix ? (
          <>
            <span className="font-bold">{prefix}</span>&nbsp;&nbsp;
          </>
        ) : null}
        <span>{serializeBlocks(blocks)}</span>
      </div>
    </>
  );
};
