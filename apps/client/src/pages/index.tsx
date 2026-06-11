import { Layout } from '@enums';

const HomePage = () => {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <h1 className="text-4xl font-bold text-color-primary">Welcome to ParthHub</h1>
      <p className="mt-4 text-lg text-color-secondary">Your learning platform for PDFs, Tests, Videos & Courses</p>
      <div className="mt-8 flex gap-4">
        <a href="/sign-in" className="rounded bg-blue-primary px-6 py-3 text-white">Get Started</a>
        <a href="/sign-up" className="rounded border border-blue-primary px-6 py-3 text-blue-primary">Sign Up</a>
      </div>
    </div>
  );
};

(HomePage as any).layout = 'public';
export default HomePage;
