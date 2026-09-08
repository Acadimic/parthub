import { Spinner } from './Spinner';

interface IProps {
  loading: boolean;
}

export const BackdropLoader = ({ loading }: IProps) => {
  if (!loading) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Spinner />
    </div>
  );
};
