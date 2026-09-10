export const Html = ({ html }: { html: string }): React.ReactNode => {
  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: html }} className="text-sm font-medium text-foreground border-primary" />
    </>
  );
};
