import CircularProgress from '@mui/material/CircularProgress';

export const FullScreenLoader = ({ loading }: { loading: boolean }) => {
  if (!loading) return null;
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background-primary">
      <CircularProgress />
    </div>
  );
};
