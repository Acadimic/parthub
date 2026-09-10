interface ISpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-8 h-8',
};

export const Spinner = ({ size = 'md', className }: ISpinnerProps) => {
  return (
    <div
      className={`${className || sizeMap[size]} border-2 border-solid border-primary rounded-full animate-spin border-t-transparent`}
    />
  );
};

export type { ISpinnerProps };
