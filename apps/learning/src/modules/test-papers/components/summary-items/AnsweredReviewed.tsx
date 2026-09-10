import { DotIndicator } from '@repo/ui/app';

interface IProps {
  count: number;
  title?: string;
  isLarge?: boolean;
}

export const AnsweredReviewed = ({ count, title, isLarge }: IProps) => {
  const className = isLarge ? 'w-8 p-2 text-xs' : 'w-6 p-1 text-[11px]';
  return (
    <>
      <div className="flex space-x-2 items-center text-muted-foreground">
        <DotIndicator>
          <div
            className={`${className} flex-none font-bold text-warning-foreground rounded-full bg-chart-4 flex justify-center items-center`}
          >
            {count}
          </div>
        </DotIndicator>
        {title ? (
          <div className="leading-3">
            <span className="text-[11px] font-medium">{title}</span>
          </div>
        ) : null}
      </div>
    </>
  );
};
