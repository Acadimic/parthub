import { Container, Testimonials } from '@components/others';
import { Courses } from '@modules/courses';
import { TESTIMONIALS } from './testimonials';
import {
  Band,
  ContinueLearning,
  Faq,
  Features,
  Hero,
  HowItWorks,
  SectionHeading,
  StandardsGrid,
  TeachBanner,
} from './components';

/** The landing page: the pitch, the catalogue, and the reasons to trust it. */
export const Home = () => (
  <div className="flex flex-col">
    {/* The wash runs edge to edge behind the hero, in the product's own hues, so it reads as a stage. */}
    <Band className="bg-gradient-to-br from-primary/10 via-background to-chart-2/10">
      <Hero />
    </Band>
    <Container>
      <ContinueLearning />
      <StandardsGrid />
    </Container>
    <Band className="border-y border-border bg-muted/30">
      <HowItWorks />
    </Band>
    <Container>
      <div className="pt-12 md:pt-16">
        <SectionHeading
          eyebrow="Catalogue"
          title="Explore courses"
          subtitle="Filter by your standard and subject, or search the whole catalogue."
          action={{ label: 'See the full catalogue', href: '/courses' }}
        />
      </div>
    </Container>
    <Courses isFilter withHeading={false} />
    <Container>
      <Features />
      <TeachBanner />
    </Container>
    <Band className="border-t border-border bg-muted/30">
      <div className="pt-12 md:pt-16">
        <SectionHeading
          eyebrow="Learners"
          title="What students say"
          subtitle="From people who finished a course here."
          action={null}
        />
      </div>
      <Testimonials testimonials={TESTIMONIALS} />
    </Band>
    <Container>
      <Faq />
    </Container>
  </div>
);
