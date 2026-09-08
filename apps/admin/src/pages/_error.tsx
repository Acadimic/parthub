import Error, { type ErrorProps } from 'next/error';

const CustomErrorComponent = (props: ErrorProps) => {
  return <Error statusCode={props.statusCode} />;
};

export default CustomErrorComponent;
