import { DotsNineIcon } from '@phosphor-icons/react';

interface IProps {
  title: string;
  subtitle?: string;
}

export const TitleWithIcon = ({ title, subtitle }: IProps) => {
  return (
    <div className="flex items-center justify-start">
      <div className="flex flex-col space-y-1 py-3">
        <h1 className="text-sm font-bold text-center flex items-center gap-3">
          <DotsNineIcon weight="bold" className="w-5 h-5 text-info" />
          {title}
        </h1>
        {subtitle && <div className="text-muted-foreground">{subtitle}</div>}
      </div>
    </div>
  );
};
