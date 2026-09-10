import { Label } from '@repo/ui/app';
import { errorToast } from '@utils/helpers';
import { useState } from 'react';
import { Actions } from '../Actions';
import { type ImageNode } from '../types';

interface IProps {
  block: ImageNode;
  handleChange: (block: ImageNode) => void;
  closeModal: () => void;
}

export const AddImage = ({ block, handleChange, closeModal }: IProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2000000) {
      errorToast({ message: 'File size must be less than 2MB.' });
      return;
    }
    setSelectedFile(file);
  };

  const handleSubmit = () => {
    if (!selectedFile) {
      if (!block.data) {
        errorToast({ message: 'Please select a file.' });
        return false;
      }
      return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(selectedFile);
    reader.onload = function (e) {
      const src = e.target?.result as string; // Base64 bitmap data
      handleChange({ ...block, data: src });
      closeModal();
    };
  };

  // console.log('####data: ', (selectedFile && URL.createObjectURL(selectedFile)) || block.data, selectedFile);

  return (
    <div className="flex flex-col gap-4 items-stretch justify-between min-h-40">
      <div className="flex justify-center py-4 w-full">
        <input
          id="image-input"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="w-full block text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary cursor-pointer border border-border rounded-md p-2"
        />
      </div>
      {(selectedFile ?? block.data) && (
        <>
          <Label label="Preview" required />
          <img
            src={(selectedFile && URL.createObjectURL(selectedFile)) || block.data}
            alt="name"
            className="max-w-[340px] border border-border"
          />
        </>
      )}
      <Actions handleSubmit={handleSubmit} closeModal={closeModal} />
    </div>
  );
};
