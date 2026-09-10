interface IProps {
  text: string;
}

export function VerticalLineWithText({ text }: IProps) {
  return (
    <div className="flex flex-col items-center h-full">
      <div className="flex-grow w-[1px] bg-border"></div>
      <div className="flex-grow-0 my-4 text-muted-foreground font-normal">{text}</div>
      <div className="flex-grow w-[1px] bg-border"></div>
    </div>
  );
}
