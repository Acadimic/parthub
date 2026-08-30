import { X } from '@phosphor-icons/react';
import { Button } from '../buttons';

interface IProps {
  onForceClose: () => void;
  onCancel: () => void;
  message?: string;
}

export const Confirm = ({ onForceClose, onCancel, message }: IProps) => {
  return (
    <div className="">
      <div className="pt-4">
        <div className="mb-2 px-4 md:px-6">
          <div className="flex justify-between items-center space-x-6 pr-1">
            <div className="font-medium text-lg text[#464E5F]">Confirm Leave?</div>
            <div>
              <button onClick={onCancel} className="bg-transparent">
                <X className="font-bold w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>
        </div>
        <div className="px-4 md:px-6 py-6">
          <div className="text-gray-800">
            {message ||
              'Data is still saving. Leaving now may lead to data loss. Do you still want to leave this event?'}
          </div>
        </div>
        <div className="px-4 md:px-6 py-3 bg-gray-50 flex flex-row-reverse rounded-b-lg gap-x-4">
          <Button onClick={onCancel}>Cancel</Button>
          <Button
            onClick={onForceClose}
            color="secondary"
            isSecondary
            className="text-gray-500 border-gray-200 hover:text-gray-500"
          >
            Leave
          </Button>
        </div>
      </div>
    </div>
  );
};
