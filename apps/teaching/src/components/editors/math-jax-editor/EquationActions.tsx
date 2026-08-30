import { PencilIcon, TrashIcon } from '@phosphor-icons/react';

interface IProps {
  onEdit: () => void;
  onDelete: () => void;
}

export const EquationActions = ({ onEdit, onDelete }: IProps) => {
  return (
    <div className="z-10 absolute -top-2 -right-0.5 opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity duration-300 bg-color-light">
      <div className="flex items-center justify-center divide-x divide-color-opposite">
        <div
          className="cursor-pointer p-2"
          onClick={(event) => {
            event.stopPropagation();
            onEdit();
          }}
        >
          <PencilIcon />
        </div>
        <div className="cursor-pointer p-2" onClick={onDelete}>
          <TrashIcon />
        </div>
      </div>
    </div>
  );
};
