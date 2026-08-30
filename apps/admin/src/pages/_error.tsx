import Error from 'next/error';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomErrorComponent = (props: any) => {
  return <Error statusCode={props.statusCode} />;
};

export default CustomErrorComponent;
