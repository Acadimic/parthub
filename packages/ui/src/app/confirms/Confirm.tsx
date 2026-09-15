import { XIcon } from '@phosphor-icons/react';
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
            <div className="font-medium text-lg text-foreground">Confirm Leave?</div>
            <div>
              <button onClick={onCancel} className="bg-transparent">
                <XIcon className="font-bold w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>
        <div className="px-4 md:px-6 py-6">
          <div className="text-foreground">
            {message ||
              'Data is still saving. Leaving now may lead to data loss. Do you still want to leave this event?'}
          </div>
        </div>
        <div className="px-4 md:px-6 py-3 bg-muted flex flex-row-reverse rounded-b-lg gap-x-4">
          <Button onClick={onCancel}>Cancel</Button>
          <Button
            onClick={onForceClose}
            color="secondary"
            isSecondary
            className="text-muted-foreground border-border hover:text-muted-foreground"
          >
            Leave
          </Button>
        </div>
      </div>
    </div>
  );
};
