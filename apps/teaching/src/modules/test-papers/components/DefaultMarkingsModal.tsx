import { type DefaultMarkingType } from '@repo/shared/interfaces';
import { Modal, ModalFooter } from '@repo/ui/app';
import { DefaultMarkingsTable } from './DefaultMarkingsTable';

interface IProps {
  isOpen: boolean;
  defaultMarkings: DefaultMarkingType;
  onSave: (markings: DefaultMarkingType) => void;
  isLoading: boolean;
  onClose: () => void;
  isDisabled?: boolean;
}

/**
 * The default marks table in a modal of its own, for the paper form, where the table belongs to a
 * paper that has no section yet. A section edits its table inline instead.
 *
 * Changes are applied as they are typed and the only action is Done, so there is nothing to lose
 * by closing it any other way. Render it beside the form's own modal, never inside: a `fixed`
 * panel inside a centred modal's transform is positioned against that modal, not the viewport.
 */
export const DefaultMarkingsModal = ({ defaultMarkings, onSave, isOpen, isLoading, onClose, isDisabled }: IProps) => (
  <Modal
    title="Default marks"
    description="What a question of each type is worth unless it sets its own marks."
    className="w-[calc(100%-2rem)] md:w-[36rem]"
    isOpen={isOpen}
    isLoading={isLoading}
    onClose={onClose}
    component={<DefaultMarkingsTable value={defaultMarkings} onChange={onSave} isDisabled={isDisabled} />}
    footer={<ModalFooter saveText="Done" hideCancel onSave={onClose} onCancel={onClose} isLoading={isLoading} />}
  />
);
