import { type NextPageWithLayout } from './_app';

const Home: NextPageWithLayout = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
      <p className="mt-2 text-muted-foreground">Welcome to your ParthHub dashboard</p>
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="font-semibold text-foreground">Courses</h3>
          <p className="text-muted-foreground">Browse available courses</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="font-semibold text-foreground">Tests</h3>
          <p className="text-muted-foreground">Practice with test papers</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="font-semibold text-foreground">Materials</h3>
          <p className="text-muted-foreground">Study materials & PDFs</p>
        </div>
      </div>
    </div>
  );
};

Home.layout = 'sidebar';
export default Home;
