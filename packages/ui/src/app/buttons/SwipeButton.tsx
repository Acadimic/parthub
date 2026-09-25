import { CaretDoubleRightIcon, CheckIcon } from '@phosphor-icons/react';
import React, { useEffect, useRef, useState } from 'react';
import { cn } from '../../lib/cn';

interface SwipeButtonProps {
  onComplete: () => void;
  text?: string;
  completeText?: string;
  className?: string;
  disabled?: boolean;
  /** The track's width; ignored when `isFull`, which measures the track instead. */
  width?: number;
  height?: number;
  isCompleted: boolean;
  /** Fills the container, so the swipe is as long as the space allows. */
  isFull?: boolean;
}

/** How close to the end the knob has to be released for the swipe to count. */
const COMPLETE_SLACK = 50;

/** The draggable knob. Split out so the track component holds only its own presentation. */
const SwipeSlider = ({
  isDragging,
  isCompleted,
  offsetX,
  size,
  sliderRef,
  handlers,
}: {
  isDragging: boolean;
  isCompleted: boolean;
  offsetX: number;
  size: number;
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
    role="presentation"
    className={cn(
      'absolute left-1 top-1 flex items-center justify-center rounded-full shadow-md transition-colors',
      isDragging ? 'cursor-grabbing' : 'cursor-grab',
      isCompleted ? 'bg-success text-success-foreground' : 'bg-primary text-primary-foreground',
    )}
    style={{
      width: size,
      height: size,
      transform: `translateX(${offsetX}px)`,
      touchAction: 'none',
      transition: isDragging ? 'none' : 'transform 0.3s ease-out',
    }}
    {...handlers}
  >
    {isCompleted ? (
      <CheckIcon weight="bold" className="h-5 w-5" />
    ) : (
      <CaretDoubleRightIcon weight="bold" className="h-5 w-5" />
    )}
  </div>
);

interface ISwipeOptions {
  isCompleted: boolean;
  disabled: boolean;
  /** How far the knob can travel, measured when needed so a full-width track is still right. */
  getTravel: () => number;
  onComplete: () => void;
}

/** The drag: where the knob is, and the pointer handlers that move and release it. */
const useSwipe = ({ isCompleted, disabled, getTravel, onComplete }: ISwipeOptions) => {
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [offsetX, setOffsetX] = useState(0);
  const isLocked = disabled || isCompleted;

  useEffect(() => {
    setOffsetX(isCompleted ? getTravel() : 0);
    setIsDragging(false);
  }, [isCompleted]);

  const start = (clientX: number) => {
    if (isLocked) return;
    setIsDragging(true);
    setStartX(clientX - offsetX);
  };

  const moveTo = (clientX: number) => {
    if (!isDragging || isLocked) return;
    setOffsetX(Math.max(0, Math.min(clientX - startX, getTravel())));
  };

  const end = () => {
    if (!isDragging || isLocked) return;
    setIsDragging(false);
    const travel = getTravel();
    if (offsetX >= travel - COMPLETE_SLACK) {
      setOffsetX(travel);
      onComplete();
    } else {
      setOffsetX(0);
    }
  };

  // The mouse may be released anywhere on the page, not only over the knob.
  useEffect(() => {
    document.addEventListener('mouseup', end);
    return () => document.removeEventListener('mouseup', end);
  }, [isDragging, offsetX]);

  return {
    isDragging,
    offsetX,
    handlers: {
      onTouchStart: (e: React.TouchEvent) => start(e.touches[0].clientX),
      onTouchMove: (e: React.TouchEvent) => moveTo(e.touches[0].clientX),
      onTouchEnd: end,
      onMouseDown: (e: React.MouseEvent) => start(e.clientX),
      onMouseMove: (e: React.MouseEvent) => moveTo(e.clientX),
    },
  };
};

/** The tint that follows the knob, and the instruction it slides over. */
const SwipeTrack = ({
  isCompleted,
  isDragging,
  fillWidth,
  knobSize,
  label,
}: {
  isCompleted: boolean;
  isDragging: boolean;
  fillWidth: number;
  knobSize: number;
  label: string;
}) => (
  <>
    <div
      aria-hidden="true"
      className={cn('absolute inset-y-0 left-0 rounded-full', isCompleted ? 'bg-success/15' : 'bg-primary/15')}
      style={{ width: fillWidth, transition: isDragging ? 'none' : 'width 0.3s ease-out' }}
    />
    <div
      className={cn(
        'absolute inset-0 flex items-center justify-center text-sm font-medium',
        isCompleted ? 'text-success' : 'text-primary',
      )}
      style={{ paddingLeft: knobSize }}
    >
      {label}
    </div>
  </>
);

/** The track's frame: locked when disabled, green once done, and stretched when asked to fill. */
const getTrackClass = (isCompleted: boolean, disabled: boolean, isFull: boolean, className: string) =>
  cn(
    'relative select-none overflow-hidden rounded-full border transition-colors',
    disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
    isCompleted ? 'border-success/40 bg-success/10' : 'border-primary/30 bg-primary/5',
    isFull && 'w-full',
    className,
  );

/**
 * A slide-to-confirm control: the knob has to be dragged to the far end, so a stray tap cannot
 * mark something done. The track tints behind the knob as it travels.
 */
export const SwipeButton: React.FC<SwipeButtonProps> = ({
  onComplete,
  text = 'Swipe to complete',
  completeText = 'Completed',
  className = '',
  disabled = false,
  width = 220,
  height = 40,
  isCompleted = false,
  isFull = false,
}) => {
  const buttonRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  // The knob sits inside a 4px inset on each side, so it travels the track less itself and the insets.
  const knobSize = height - 8;
  const getTravel = () => (buttonRef.current?.clientWidth ?? width) - knobSize - 8;
  const { isDragging, offsetX, handlers } = useSwipe({ isCompleted, disabled, getTravel, onComplete });

  return (
    <div
      ref={buttonRef}
      role="button"
      aria-disabled={disabled || undefined}
      aria-label={isCompleted ? completeText : text}
      className={getTrackClass(isCompleted, disabled, isFull, className)}
      style={{ width: isFull ? undefined : width, height }}
    >
      <SwipeTrack
        isCompleted={isCompleted}
        isDragging={isDragging}
        fillWidth={offsetX + knobSize + 8}
        knobSize={knobSize}
        label={isCompleted ? completeText : text}
      />
      <SwipeSlider
        isDragging={isDragging}
        isCompleted={isCompleted}
        offsetX={offsetX}
        size={knobSize}
        sliderRef={sliderRef}
        handlers={handlers}
      />
    </div>
  );
};
