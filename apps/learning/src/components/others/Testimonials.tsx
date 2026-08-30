import { DynamicSlider } from '@components/app';
import React from 'react';
import { Avatar } from '../app/avatars';
import { Container } from './Container';

interface TestimonialProps {
  name: string;
  role: string;
  content: string;
  rating: number;
  image?: string;
}

interface TestimonialsProps {
  testimonials: TestimonialProps[];
}

const StarRating: React.FC<{ rating: number }> = ({ rating }) => {
  return (
    <div className="flex items-center space-x-1">
      {[...Array(5)].map((_, index) => (
        <svg
          key={index}
          className={`w-4 h-4 ${index < rating ? 'text-yellow-400' : 'text-gray-300'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
};

const TestimonialCard: React.FC<TestimonialProps> = ({ name, role, content, rating, image }) => {
  return (
    <div className="rounded-xl md:px-6">
      <div className="flex items-center space-x-4 mb-4">
        <Avatar avatar={image} name={name} id={name} size={40} />
        <div>
          <h3 className="text-lg font-semibold">{name}</h3>
          <p className="text-sm text-color-secondary">{role}</p>
        </div>
      </div>
      <StarRating rating={rating} />
      <p className="mt-4 leading-relaxed line-clamp-6">{content}</p>
      <div className="mt-6">
        <svg className="h-8 text-color-secondary" fill="currentColor" viewBox="0 0 32 32">
          <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
        </svg>
      </div>
    </div>
  );
};

export const Testimonials: React.FC<TestimonialsProps> = ({ testimonials }) => {
  return (
    <Container>
      <section className="py-8 mt-4 px-4 border-t border-color-border">
        <div className="max-w-7xl mx-auto ">
          <div className="py-4">
            <DynamicSlider
              showDots={false}
              items={testimonials.map((testimonial, index) => (
                <TestimonialCard key={index} {...testimonial} />
              ))}
            />
          </div>
        </div>
      </section>
    </Container>
  );
};
