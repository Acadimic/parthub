import { Select } from '@components/app/selects';
import { Modal, ModalFooter, TextInput } from '@repo/ui/app';
import { LinkType } from '@enums';
import { type ISelectItem } from '@interfaces';
import { type IAttachment, useMaterialLookups, useSelectedMaterial } from '@stores';
import { validateLinkAttachment } from '@utils/helpers';

interface IProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAttachment?: IAttachment | null;
}

export const UpsertAttachmentModal = ({ isOpen, onClose, selectedAttachment }: IProps) => {
  // An attachment has no store of its own: it is a subdocument of the material being edited.
  const selectedMaterial = useSelectedMaterial();
  const { patchAttachment } = useMaterialLookups();

  const patchSelectedAttachment = (fields: Partial<IAttachment>) => {
    if (!selectedMaterial || !selectedAttachment) return;
    patchAttachment(selectedMaterial._id, selectedAttachment.key, fields);
  };

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
                    onChange={(e) => patchSelectedAttachment({ fileName: e.target.value })}
                    placeholder="Enter Name"
                  />
                </div>
                <div>
                  <TextInput
                    label="URL"
                    required
                    value={selectedAttachment.url}
                    onChange={(e) => patchSelectedAttachment({ url: e.target.value })}
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
                      values[0] && patchSelectedAttachment({ linkType: values[0].value as LinkType })
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
};
