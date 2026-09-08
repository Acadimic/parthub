import { Spinner } from '@parthhub/ui/app';

interface IProps {
  isLoading: boolean;
}

export const Loader = ({ isLoading }: IProps) => {
  if (!isLoading) return null;
  return (
    <div className="w-full h-full min-h-[200px] flex justify-center items-center">
      <Spinner className="w-8 h-8" />
    </div>
  );
};
