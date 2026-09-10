import { type IFunctionProps } from '@interfaces';
import { errorToast } from '@utils/helpers';
import { useState } from 'react';
import { FunctionFooter } from './components';

const UploadImage = (props: IFunctionProps) => {
  const { handleChange, name, closeModal } = props;
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
      errorToast({ message: 'Please select a file.' });
      return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(selectedFile);
    reader.onload = function (e) {
      const src = e.target?.result as string; // Base64 bitmap data
      handleChange({
        target: {
          name,
          value: `&nbsp;<table cellspacing="0" cellpadding="0" border="0"
          style="display: inline-table; border-collapse: collapse; vertical-align: middle;">
            <tbody>
              <tr>
                <td><img height="auto" width="100%" style="max-width: 250px;" src="${src}" alt="${selectedFile.name}" /></td>
              </tr>
            </tbody>
          </table>&nbsp;`,
        },
      });
      closeModal();
    };
  };

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
      {selectedFile && <img src={URL.createObjectURL(selectedFile)} alt="name" className="max-w-[250px]" />}
      <FunctionFooter onSave={handleSubmit} onCancel={closeModal} />
    </div>
  );
};

export default UploadImage;
