import { Button, Spinner } from '@repo/ui/app';
import { getFirebaseUser } from '@utils/firebase';
import { errorToast, splitCamelCase, successToast } from '@utils/helpers';
import { useState } from 'react';

export const Profile = () => {
  const user = getFirebaseUser();
  const [file, setFile] = useState<File | undefined>();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const getDefault = (key: string) => (key.startsWith('is') ? 'No' : 'N/A');

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setFile(undefined);
  };

  if (!user) return <></>;

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!file) {
      errorToast({ message: 'You have to choose a file' });
      return;
    }

    const formData = new FormData();
    formData.append('File', file);

    try {
      setLoading(true);
      successToast({ message: 'Photo successfuly uploaded' });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col">
      <Button className="self-end px-4 py-2" onClick={handleClickOpen} text="Upload profile photo" />

      {/* Upload Dialog */}
      {open && (
        <div className="fixed inset-0 z-[1300]">
          <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
          <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-full max-w-md">
            <div className="bg-background border border-border rounded-sm p-6">
              <h2 className="text-lg font-bold mb-4">Upload your profile photo</h2>
              <form onSubmit={handleUpload} className="flex flex-col gap-12">
                <input type="file" onChange={(e) => setFile(e.target.files?.[0])} />
                <Button
                  type="submit"
                  text={loading ? undefined : 'Submit'}
                  className="bg-primary text-primary-foreground flex justify-center items-center p-3"
                >
                  {loading && <Spinner className="w-5 h-5" />}
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-center items-center my-4">
        <div className="w-full md:w-[50%] border border-border rounded-sm shadow-lg flex flex-col gap-6 items-center p-8">
          <img src="/images/logo-light.svg" alt="logo" />
          <div className="w-[100px] h-[100px] rounded-full bg-accent flex items-center justify-center text-[50px] font-medium text-foreground">
            {user.displayName?.[0]}
          </div>
          <h1 className="text-4xl uppercase font-bold text-[#d029d6]">{user.displayName}</h1>
          <div className="py-2 px-6 rounded-2xl flex items-center justify-center bg-blue-600 font-bold uppercase tracking-widest text-white">
            {user.email}
          </div>
          <div className="mt-4 max-w-[350px]">
            {Object.keys(user)
              .sort()
              .map((key) => {
                const value = (user as unknown as Record<string, unknown>)[key] || getDefault(key);
                if (typeof value === 'object') return null;
                if (['_id', 'createdAt', 'updatedAt', 'createdBy', 'photoUrl'].includes(key)) return null;
                return (
                  <div key={key} className="flex gap-4">
                    <span className="capitalize font-bold text-sm">{splitCamelCase(key)}:</span>{' '}
                    <span className="font-medium text-sm truncate">{String(value)}</span>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
};
