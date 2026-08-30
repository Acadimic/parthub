interface IProps {
  text: string;
}

export function HorizontalLineWithText({ text }: IProps) {
  return (
    <div className="flex items-center w-full h-full">
      <div className="flex-grow bg bg-color-border h-[1px]"></div>
      <div className="flex-grow-0 mx-4 text-color-secondary font-normal">{text}</div>
      <div className="flex-grow bg bg-color-border h-[1px]"></div>
    </div>
  );
}
