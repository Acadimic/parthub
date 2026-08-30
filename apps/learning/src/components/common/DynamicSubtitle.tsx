import { getPlural } from '@utils/helpers';

interface IProps {
  title: string;
  subtitle: string;
  count: number;
}

export const DynamicSubtitle = ({ title, subtitle, count }: IProps) => {
  return (
    <div className="">
      <span className="">{title}</span>{' '}
      <span className="text-xs text-color-secondary">
        ({count ? `${count} ${getPlural(count, subtitle)}` : `No ${subtitle}`})
      </span>
    </div>
  );
};
