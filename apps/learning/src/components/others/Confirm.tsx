import { Button } from '@components/app';

interface IProps {
  reject: () => void;
  accept: () => void;
  message: string;
}

export const Confirm = ({ message, accept, reject }: IProps) => {
  return (
    <div className="w-full max-w-lg min-w-[300px]">
      <div className="w-full px-6 py-6 bg-white rounded dark:bg-background-dark">
        <div className="mt-6 mb-2">
          <div className="text-center text-sm font-semibold text-gray-800">{message}</div>
          <div className="flex justify-center mt-8 space-x-4">
            <div>
              <Button isSecondary text="No" onClick={reject} />
            </div>
            <div>
              <Button text="Yes" onClick={accept} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
