interface IProps {
  title: string;
  subtitle?: string;
}

export const Title = ({ title, subtitle }: IProps) => {
  return (
    <div className="flex items-center justify-center">
      <div className="flex flex-col space-y-1 px-4 py-3">
        <h1 className="text-2xl font-bold text-center">{title}</h1>
        <div className="text-muted-foreground">{subtitle}</div>
      </div>
    </div>
  );
};
