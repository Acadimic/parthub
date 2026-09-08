import { Select } from '@components/app/selects';
import { Modal, ModalFooter, TextInput } from '@parthhub/ui/app';
import { LinkType } from '@enums';
import { ISelectItem } from '@interfaces';
import { IAttachment } from '@stores';
import { validateLinkAttachment } from '@utils/helpers';
import { observer } from 'mobx-react-lite';

interface IProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAttachment?: IAttachment | null;
}

export const UpsertAttachmentModal = observer(({ isOpen, onClose, selectedAttachment }: IProps) => {
  const handleAdd = () => {
    if (selectedAttachment && validateLinkAttachment(selectedAttachment)) onClose();
  };

  return (
    <>
      <Modal
        title={`Add Link`}
        isOpen={isOpen}
        onClose={onClose}
        component={
          selectedAttachment && (
            <div className="min-h-[60vh] pb-4">
              <div className="flex flex-col space-y-3">
                <div>
                  <TextInput
                    label="Name"
                    required
                    value={selectedAttachment.fileName}
                    onChange={(e) => selectedAttachment.setFileName(e.target.value)}
                    placeholder="Enter Name"
                  />
                </div>
                <div>
                  <TextInput
                    label="URL"
                    required
                    value={selectedAttachment.url}
                    onChange={(e) => selectedAttachment.setUrl(e.target.value)}
                    placeholder="Enter URL"
                    disabled={selectedAttachment.isUploaded}
                  />
                </div>
                <div>
                  <Select
                    label="Link Type"
                    items={Object.values(LinkType).map((item) => ({ label: item, value: item }))}
                    values={selectedAttachment.linkType ? [selectedAttachment.linkType] : []}
                    onChange={(values: ISelectItem[]) =>
                      values[0] && selectedAttachment.setLinkType(values[0].value as LinkType)
                    }
                    isSingleSelect
                    isDisabled={selectedAttachment.isUploaded}
                  />
                </div>
              </div>
            </div>
          )
        }
        footer={
          <ModalFooter saveText="Add" cancelText="Cancel" onSave={handleAdd} onCancel={onClose} isLoading={false} />
        }
      />
    </>
  );
});
