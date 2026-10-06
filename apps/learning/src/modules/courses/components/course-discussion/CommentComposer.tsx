import { FileDropZone } from '@components/app/selects';
import { useAttachment } from '@hooks/attachment.hook';
import { DISCUSSION_LIMITS } from '@repo/shared/utils';
import { CommentComposer as SharedComposer } from '@repo/ui/app';
import { useDiscussionStore, useSelectorStore } from '@stores';
import { getObjectId } from '@utils/helpers';

interface IProps {
  courseId: string;
  /** The top-level comment this replies to, or null for a new thread. */
  parentId: string | null;
  placeholder: string;
  isAutoFocus: boolean;
  /** Called once the comment is posted. */
  onPosted: () => void;
  onCancel: (() => void) | null;
}

/** The shared composer, posting through this app's upload and the discussion store. */
export const CommentComposer = ({ courseId, parentId, placeholder, isAutoFocus, onPosted, onCancel }: IProps) => {
  const { uploadFilesToS3 } = useAttachment();

  const submit = async (body: string, files: File[]) => {
    const _id = getObjectId();
    const attachments = await uploadFilesToS3(_id, files);
    // The upload toasts its own failure; posting without the files would lose them silently.
    if (attachments.length !== files.length) return false;
    // Where the learner is in the course as they post, so a teacher can see what a doubt is about.
    const { selectedCourseModuleId, selectedMaterialId, selectedTestPaperId } = useSelectorStore.getState();
    const isSaved = await useDiscussionStore.getState().saveComment({
      _id,
      course: courseId,
      parent: parentId,
      courseModule: selectedCourseModuleId || null,
      material: selectedMaterialId || null,
      testPaper: selectedTestPaperId || null,
      body,
      attachments,
    });
    if (isSaved) onPosted();
    return isSaved;
  };

  return (
    <SharedComposer
      placeholder={placeholder}
      submitLabel={parentId ? 'Reply' : 'Post'}
      rows={parentId ? 2 : 3}
      isAutoFocus={isAutoFocus}
      onSubmit={submit}
      onCancel={onCancel}
      renderFilePicker={(trigger, onPick) => (
        <FileDropZone
          selectedFiles={[]}
          setSelectedFiles={onPick}
          maxFiles={DISCUSSION_LIMITS.MAX_ATTACHMENTS}
          hidePreview
          isImage
          isPdf
        >
          {trigger}
        </FileDropZone>
      )}
    />
  );
};
