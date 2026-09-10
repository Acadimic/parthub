interface IProps {
  text: string;
}

export const HeaderTitle = ({ text }: IProps) => {
  return <h1 className="text-center font-medium text-xl lg:text-xl text-foreground">{text}</h1>;
};
