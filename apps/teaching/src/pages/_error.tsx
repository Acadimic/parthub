import Error from 'next/error';

const CustomErrorComponent = (props: any) => {
  return <Error statusCode={props.statusCode} />;
};

export default CustomErrorComponent;
