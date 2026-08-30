import Error from 'next/error';

const CustomErrorComponent = (props: { statusCode: number }) => {
  return <Error statusCode={props.statusCode} />;
};

export default CustomErrorComponent;
