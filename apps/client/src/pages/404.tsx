const NotFoundPage = () => {
  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <h1 className="text-6xl font-bold text-color-primary">404</h1>
      <p className="mt-4 text-lg text-color-secondary">Page not found</p>
      <a href="/" className="mt-6 rounded bg-blue-primary px-6 py-3 text-white">
        Go Home
      </a>
    </div>
  );
};

(NotFoundPage as any).layout = 'none';
export default NotFoundPage;
