import { CaretDoubleRightIcon, CheckIcon } from '@phosphor-icons/react';
import React, { useEffect, useRef, useState } from 'react';

interface SwipeButtonProps {
  onComplete: () => void;
  text?: string;
  completeText?: string;
  className?: string;
  disabled?: boolean;
  width?: number;
  height?: number;
  isCompleted: boolean;
}

/** The draggable knob. Split out so the track component holds only its own presentation. */
const SwipeSlider = ({
  isDragging,
  isCompleted,
  offsetX,
  sliderRef,
  handlers,
}: {
  isDragging: boolean;
  isCompleted: boolean;
  offsetX: number;
  sliderRef: React.RefObject<HTMLDivElement | null>;
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: () => void;
    onMouseDown: (e: React.MouseEvent) => void;
    onMouseMove: (e: React.MouseEvent) => void;
  };
}) => (
  <div
    ref={sliderRef}
    className={`absolute top-0 h-full aspect-square rounded-full shadow-lg transition-colors ${
      isDragging ? 'cursor-grabbing' : 'cursor-grab'
    } ${isCompleted ? 'bg-success' : 'bg-muted'}`}
    style={{
      left: 0,
      transform: `translateX(${offsetX}px)`,
      touchAction: 'none',
      transition: isDragging ? 'none' : 'transform 0.3s ease-out',
    }}
    {...handlers}
  >
    <div className="h-full flex items-center justify-center">
      {isCompleted ? (
        <CheckIcon weight="bold" className="text-white w-5 h-5" />
      ) : (
        <CaretDoubleRightIcon weight="bold" className="text-info w-5 h-5" />
      )}
    </div>
  </div>
);

export const SwipeButton: React.FC<SwipeButtonProps> = ({
  onComplete,
  text = 'Swipe to complete',
  completeText = 'Completed',
  className = '',
  disabled = false,
  width = 220,
  height = 36,
  isCompleted = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [offsetX, setOffsetX] = useState(0);
  const buttonRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOffsetX(isCompleted ? width - height : 0);
    setIsDragging(false);
  }, [isCompleted, width, height]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || isCompleted) return;
    setIsDragging(true);
    setStartX(e.touches[0].clientX - offsetX);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled || isCompleted) return;
    setIsDragging(true);
    setStartX(e.clientX - offsetX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || disabled || isCompleted) return;
    const currentX = e.touches[0].clientX;
    const newOffsetX = Math.max(0, Math.min(currentX - startX, width - height));
    setOffsetX(newOffsetX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || disabled || isCompleted) return;
    const currentX = e.clientX;
    const newOffsetX = Math.max(0, Math.min(currentX - startX, width - height));
    setOffsetX(newOffsetX);
  };

  const handleDragEnd = () => {
    if (!isDragging || disabled || isCompleted) return;
    setIsDragging(false);
    if (offsetX >= width - height - 50) {
      setOffsetX(width - height);
      onComplete();
    } else {
      setOffsetX(0);
    }
  };

  useEffect(() => {
    const handleMouseUp = () => handleDragEnd();
    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, [isDragging, offsetX]);

  return (
    <div
      ref={buttonRef}
      className={`relative overflow-hidden rounded-full ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      } ${className} border ${isCompleted ? 'border-success' : 'border-primary bg-transparent'}`}
      style={{ width, height }}
    >
      <div
        className="absolute inset-0 flex items-center justify-center select-none text-sm"
        style={{ opacity: isCompleted ? 0 : 1 }}
      >
        {text}
      </div>
      <div
        className="absolute inset-0 flex items-center justify-center select-none text-sm"
        style={{ opacity: isCompleted ? 1 : 0 }}
      >
        {completeText}
      </div>
      <SwipeSlider
        isDragging={isDragging}
        isCompleted={isCompleted}
        offsetX={offsetX}
        sliderRef={sliderRef}
        handlers={{
          onTouchStart: handleTouchStart,
          onTouchMove: handleTouchMove,
          onTouchEnd: handleDragEnd,
          onMouseDown: handleMouseDown,
          onMouseMove: handleMouseMove,
        }}
      />
    </div>
  );
};
