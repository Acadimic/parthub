import { Link } from '@parthhub/ui/app';
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
        <div className="w-full flex flex-col-reverse lg:flex-row items-start lg:items-center justify-center py-4 relative min-h-[500px]">
          <div className="text-left z-10">
            <div className="text-3xl md:text-6xl font-medium max-w-full md:max-w-[800px]">
              Academic Courses That Drive Results
            </div>
            <div className="mt-2 max-w-[500px]">
              Accelerate your career with 10,000+ courses from leading educators and institutions.
            </div>
            <div className="flex justify-start space-x-3 mt-6">
              <Link className="px-6 md:px-8 py-3" href="/sign-in">
                Join For Free
              </Link>
              <Link
                isSecondary
                className="px-6 md:px-8 py-3 text-color-primary"
                href="https://teach.acadimic.com"
                target="_blank"
              >
                Teach On Acadimic
              </Link>
            </div>
          </div>
          <div className="z-10 flex justify-center lg:justify-end w-full">
            <img src="/images/banner.png" alt="Banner" className="h-auto" />
          </div>
        </div>
        <BannerImg />
      </Container>
      <div className="py-8 bg-background-primary">
        <Title title="Explore Courses" subtitle="Discover paths to your personal and professional growth" />
        <Courses />
      </div>
      <div className="py-8 bg-background-primary">
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
