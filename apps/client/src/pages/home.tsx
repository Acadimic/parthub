import { NextPageWithLayout } from './_app';

const Home: NextPageWithLayout = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold text-color-primary">Dashboard</h1>
      <p className="mt-2 text-color-secondary">Welcome to your ParthHub dashboard</p>
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-color-border bg-background-paper p-4">
          <h3 className="font-semibold text-color-primary">Courses</h3>
          <p className="text-color-secondary">Browse available courses</p>
        </div>
        <div className="rounded-lg border border-color-border bg-background-paper p-4">
          <h3 className="font-semibold text-color-primary">Tests</h3>
          <p className="text-color-secondary">Practice with test papers</p>
        </div>
        <div className="rounded-lg border border-color-border bg-background-paper p-4">
          <h3 className="font-semibold text-color-primary">Materials</h3>
          <p className="text-color-secondary">Study materials & PDFs</p>
        </div>
      </div>
    </div>
  );
};

Home.layout = 'sidebar';
export default Home;
