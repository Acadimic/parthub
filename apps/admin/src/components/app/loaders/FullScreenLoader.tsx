import { Spinner } from './';

interface IProps {
  withHeader?: boolean;
  loading: boolean;
}

export function FullScreenLoader({ withHeader, loading }: IProps) {
  return (
    <>
      {loading ? (
        <div
          className={`${withHeader ? 'h-[calc(100vh-96px)]' : 'h-screen'} w-full flex justify-center items-center bg-transparent`}
        >
          <Spinner className="w-12 h-12" />
        </div>
      ) : null}
    </>
  );
}
