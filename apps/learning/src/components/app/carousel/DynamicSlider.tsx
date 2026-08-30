import { CaretLeft, CaretRight, Circle } from '@phosphor-icons/react';
import React, { useEffect, useState } from 'react';

interface DynamicSliderProps {
  items: React.ReactNode[];
  autoPlayInterval?: number;
  autoPlay?: boolean;
  showArrows?: boolean;
  showDots?: boolean;
  className?: string;
  height?: string | number;
  gap?: number;
}

export const DynamicSlider = ({
  items,
  autoPlayInterval = 5000,
  autoPlay = false,
  showDots = false,
  showArrows = true,
  className = '',
  height = 380,
  gap = 10,
}: DynamicSliderProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const getItemsPerView = () => {
    if (typeof window === 'undefined') return 1;
    if (window.innerWidth >= 1024) return 4;
    if (window.innerWidth >= 768) return 3;
    return 1;
  };

  const [itemsPerView, setItemsPerView] = useState(getItemsPerView());
  const maxIndex = Math.ceil(items.length / itemsPerView) - 1;

  useEffect(() => {
    const handleResize = () => {
      setItemsPerView(getItemsPerView());
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const goToPrevious = () => {
    setActiveIndex((current) => {
      const prevIndex = current - 1;
      return prevIndex < 0 ? maxIndex : prevIndex;
    });
  };

  const goToNext = () => {
    setActiveIndex((current) => {
      const nextIndex = current + 1;
      return nextIndex > maxIndex ? 0 : nextIndex;
    });
  };

  const goToIndex = (index: number) => {
    const max = items.length - itemsPerView;
    setActiveIndex(Math.min(index, max));
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

  const slideWidth = `calc((100% - ${gap * (itemsPerView - 1)}px) / ${itemsPerView})`;

  return (
    <div
      className={`relative overflow-hidden w-full ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ height }}
    >
      <div
        className="flex h-full transition-transform duration-500 ease-in-out"
        style={{
          transform: `translateX(calc(-${activeIndex * 100}% - ${activeIndex * gap}px))`,
        }}
      >
        {items.map((item, index) => (
          <div
            key={index}
            className="flex-none h-full"
            style={{
              width: slideWidth,
              marginRight: index === items.length - 1 ? 0 : gap,
            }}
          >
            {item}
          </div>
        ))}
      </div>
      {showArrows && items.length > itemsPerView && (
        <>
          <div className="absolute left-2 top-1/2 -translate-y-1/2 border border-color-border rounded-full">
            <button
              onClick={goToPrevious}
              className="bg-background-paper hover:bg-background-paper shadow-md z-10 p-1.5 rounded-full"
            >
              <CaretLeft weight="bold" className="w-4 h-4" />
            </button>
          </div>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 border border-color-border rounded-full">
            <button
              onClick={goToNext}
              className="bg-background-paper hover:bg-background-paper shadow-md z-10 p-1.5 rounded-full"
            >
              <CaretRight weight="bold" className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
      {showDots && maxIndex + 1 > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
          {Array.from({ length: maxIndex + 1 }).map((_, index) => (
            <button key={index} onClick={() => goToIndex(index * itemsPerView)} className="p-0.5">
              <Circle weight="fill" className="w-2 h-2 text-color-secondary" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
