import { IAttachment } from '@stores';
import { DocumentType } from '../../enums';
import { errorToast } from './toasts';
import { isValidUrl } from '@parthhub/ui/lib';

export const validateLinkAttachment = (selectedAttachment: IAttachment | null): boolean => {
  if (!selectedAttachment) {
    errorToast({ message: 'No attachment selected.' });
    return false;
  }
  if (!selectedAttachment.fileName?.trim()) {
    errorToast({ message: 'Please enter a valid name.' });
    return false;
  }
  if (!selectedAttachment.url?.trim() || !isValidUrl(selectedAttachment.url)) {
    errorToast({ message: 'Please enter a valid url.' });
    return false;
  }
  if (selectedAttachment?.documentType === DocumentType.LINK && !selectedAttachment.linkType) {
    errorToast({ message: 'Please select a link type.' });
    return false;
  }
  return true;
};
