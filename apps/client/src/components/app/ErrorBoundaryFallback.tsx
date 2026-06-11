export const ErrorBoundaryFallback = ({ error }: { error: Error }) => {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center">
      <h2 className="text-xl font-bold text-red-500">Something went wrong</h2>
      <p className="mt-2 text-color-secondary">{error.message}</p>
      <button
        className="mt-4 rounded bg-blue-primary px-4 py-2 text-white"
        onClick={() => window.location.reload()}
      >
        Reload
      </button>
    </div>
  );
};
