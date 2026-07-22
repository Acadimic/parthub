interface IProps {
  text: string;
}

export const HeaderTitle = ({ text }: IProps) => {
  return <h1 className="text-center font-medium text-xl lg:text-xl text-color-primary">{text}</h1>;
};
