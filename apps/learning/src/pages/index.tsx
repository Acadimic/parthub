import { Link } from '@repo/ui/app';
import { BannerImg } from '@components/images';
import { Container, Testimonials, Title } from '@components/others';
import { Layout } from '@enums';
import { Courses } from '@modules/courses';

const testimonialData = [
  {
    id: 'ts1',
    name: 'Sarah Johnson',
    role: 'Computer Science Student',
    content:
      'The programming courses here have transformed my understanding of software development. The hands-on projects and real-world applications made complex concepts much easier to grasp. I particularly enjoyed the interactive coding exercises.',
    rating: 5,
    avatar: null,
  },
  {
    id: 'ts2',
    name: 'Michael Chen',
    role: 'Data Science Professional',
    content:
      'As someone transitioning into data science, these courses provided exactly what I needed. The curriculum is well-structured, and the instructors explain complex statistical concepts in an accessible way. The practical assignments helped me build a strong portfolio.',
    rating: 5,
    avatar: null,
  },
  {
    id: 'tp3',
    name: 'Emily Rodriguez',
    role: 'High School Teacher',
    content:
      "The education courses here have greatly improved my teaching methods. I've learned innovative ways to engage students and make learning more interactive. The platform's flexibility allowed me to learn at my own pace while working full-time.",
    rating: 4,
    avatar: null,
  },
  {
    id: 'ts4',
    name: 'David Kumar',
    role: 'Business Analytics Student',
    content:
      "The quality of content and instruction is outstanding. I've taken several analytics courses, and each one has provided valuable insights that I've been able to apply directly in my internship. The community support is also fantastic.",
    rating: 5,
    avatar: null,
  },
  {
    id: 'ts5',
    name: 'Lisa Zhang',
    role: 'Machine Learning Engineer',
    content:
      'The advanced AI and machine learning courses here are top-notch. They strike the perfect balance between theoretical foundations and practical implementation. The projects helped me develop skills that I use daily in my work.',
    rating: 4,
    avatar: null,
  },
  {
    id: 'ts6',
    name: 'James Wilson',
    role: 'Web Development Student',
    content:
      "I started as a complete beginner, and now I'm building full-stack applications. The step-by-step approach and comprehensive coverage of modern web technologies made my learning journey smooth and enjoyable.",
    rating: 5,
    avatar: null,
  },
];

const Home = () => {
  return (
    <div className="">
      <Container>
        <div className="relative grid min-h-[500px] w-full grid-cols-1 items-center gap-10 py-12 lg:grid-cols-2 lg:gap-16 lg:py-16">
          <div className="z-10 order-2 text-left lg:order-1">
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl xl:text-6xl">
              Academic Courses That Drive Results
            </h1>
            <p className="mt-5 max-w-xl text-base text-muted-foreground md:text-lg">
              Accelerate your career with 10,000+ courses from leading educators and institutions.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link className="px-6 py-3 md:px-8" href="/sign-in">
                Join For Free
              </Link>
              <Link
                isSecondary
                className="px-6 py-3 text-foreground md:px-8"
                href="https://teach.acadimic.com"
                target="_blank"
              >
                Teach On Acadimic
              </Link>
            </div>
          </div>
          <div className="z-10 order-1 flex justify-center lg:order-2 lg:justify-end">
            {/* A transparent cut-out, so it carries no frame: a ring or shadow would trace the empty
                corners rather than the subject. Intrinsic size is set because this is the LCP
                element and the copy beside it would otherwise shift as the image decodes. */}
            <img
              src="/images/banner.png"
              alt="A teacher discussing a book with a student"
              width={512}
              height={512}
              loading="eager"
              fetchPriority="high"
              className="h-auto w-full max-w-[360px] sm:max-w-[420px] lg:max-w-[512px]"
            />
          </div>
        </div>
        <BannerImg />
      </Container>
      <div className="py-8 bg-background">
        <Title title="Explore Courses" subtitle="Discover paths to your personal and professional growth" />
        <Courses />
      </div>
      <div className="py-8 bg-background">
        <Title
          title="What Our Students Say"
          subtitle="Read what our students have to say about their learning experience"
        />
        <Testimonials testimonials={testimonialData} />
      </div>
    </div>
  );
};

Home.layout = Layout.PUBLIC;

export default Home;
