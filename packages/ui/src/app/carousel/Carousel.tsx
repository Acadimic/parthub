import { CaretLeftIcon, CaretRightIcon, CircleIcon } from '@phosphor-icons/react';
import React, { useCallback, useEffect, useState } from 'react';

interface CarouselProps {
  items: React.ReactNode[];
  autoPlayInterval?: number;
  autoPlay?: boolean;
  showArrows?: boolean;
  showDots?: boolean;
  className?: string;
  height?: string | number;
}

export const Carousel = ({
  items,
  autoPlayInterval = 5000,
  autoPlay = true,
  showArrows = true,
  showDots = true,
  className = '',
  height = 400,
}: CarouselProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const goToNext = useCallback(() => {
    setActiveIndex((current) => (current + 1) % items.length);
  }, [items.length]);

  const goToPrevious = () => {
    setActiveIndex((current) => (current - 1 + items.length) % items.length);
  };

  const goToIndex = (index: number) => {
    setActiveIndex(index);
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (autoPlay && !isHovered) {
      intervalId = setInterval(goToNext, autoPlayInterval);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [autoPlay, autoPlayInterval, goToNext, isHovered]);

  return (
    <div
      className={`relative overflow-hidden w-full ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ height }}
    >
      <div
        className="flex h-full transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${activeIndex * 100}%)` }}
      >
        {items.map((item, index) => (
          <div key={index} className="flex-none w-full h-full">
            {item}
          </div>
        ))}
      </div>
      {showArrows && items.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-background-paper hover:bg-background-paper shadow-md p-1.5 rounded-full border border-color-border"
          >
            <CaretLeftIcon weight="bold" className="w-4 h-4" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-background-paper hover:bg-background-paper shadow-md p-1.5 rounded-full border border-color-border"
          >
            <CaretRightIcon weight="bold" className="w-4 h-4" />
          </button>
        </>
      )}
      {showDots && items.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
          {items.map((_, index) => (
            <button key={index} onClick={() => goToIndex(index)} className="p-0.5">
              <CircleIcon
                weight="fill"
                className={`w-2 h-2 ${index === activeIndex ? 'text-color-primary' : 'text-color-secondary'}`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
