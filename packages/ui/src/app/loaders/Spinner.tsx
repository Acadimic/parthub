interface IProps {
  className?: string;
}

export function Spinner({ className }: IProps): JSX.Element {
  return (
    <div
      className={`${
        className || 'w-5 h-5'
      } border-2 border-solid border-blue-primary rounded-full animate-spin border-t-transparent`}
    />
  );
}
