interface IProps {
  label?: string;
  iconSize?: string;
}

export const BlankState = ({ label, iconSize }: IProps) => {
  return (
    <div className="flex flex-col items-center justify-center">
      <img className={iconSize || 'h-12'} src="/images/empty-data.svg" alt="empty" />
      <p className="text-sm font-semibold text-color-secondary">{label || 'No data available'}</p>
    </div>
  );
};
