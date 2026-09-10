interface IProps {
  count: number;
  title?: string;
  isLarge?: boolean;
}

export const NotAnswered = ({ count, title, isLarge }: IProps) => {
  const className = isLarge ? 'w-8 p-2 text-xs' : 'w-6 p-1 text-[11px]';
  return (
    <>
      <div className="flex space-x-2 items-center text-muted-foreground">
        <div
          className={`${className} font-bold text-destructive-foreground rounded-b-full bg-destructive flex justify-center items-center`}
        >
          {count}
        </div>
        {title ? (
          <div className="leading-3">
            <span className="text-[11px] font-medium">{title}</span>
          </div>
        ) : null}
      </div>
    </>
  );
};
