import { Card, Modal } from '@components/app';
import { UserPlusIcon, UsersThreeIcon } from '@phosphor-icons/react';
import { observer } from 'mobx-react-lite';

interface IProps {
  isOpen: boolean;
  onClose: () => void;
  openUpsertCollaboratorModal: () => void;
  openBulkAddCollaboratorsModal: () => void;
}

interface IAddCollaboratorItem {
  icon: JSX.Element;
  label: string;
  onClick: () => void;
  description: string;
}

export const AddCollaboratorsModal = observer(
  ({ isOpen, onClose, openUpsertCollaboratorModal, openBulkAddCollaboratorsModal }: IProps) => {
    const addCollaboratorsItems: IAddCollaboratorItem[] = [
      {
        icon: <UserPlusIcon weight="bold" className="w-5 h-5" />,
        label: 'Add Collaborator Manually',
        onClick: openUpsertCollaboratorModal,
        description: 'Enter details to create a collaborator profile.',
      },
      {
        icon: <UsersThreeIcon weight="bold" className="w-5 h-5" />,
        label: 'Bulk Add Collaborators Manually',
        onClick: openBulkAddCollaboratorsModal,
        description: 'Enter multiple collaborator details at once into a table.',
      },
    ];

    return (
      <>
        <Modal
          title="Add Collaborators"
          isOpen={isOpen}
          onClose={onClose}
          component={
            <div className="flex justify-center items-center">
              <div className="pt-8 max-w-[540px]">
                <div className="w-full h-full flex flex-col md:flex-row gap-4">
                  {addCollaboratorsItems.map((item) => (
                    <div
                      key={item.label}
                      className="cursor-pointer md:w-[50%] h-auto border border-color-border"
                      onClick={item.onClick}
                    >
                      <Card>
                        <div className="flex flex-col items-center justify-center gap-3">
                          <div>{item.icon}</div>
                          <div className="font-medium text-center">{item.label}</div>
                          <div className="text-sm text-gray-500 text-center">{item.description}</div>
                        </div>
                      </Card>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          }
        />
      </>
    );
  },
);
