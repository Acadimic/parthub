import { cn } from '@repo/ui/lib';
import { ViewTextContent } from '@components/tools';
import { BlankState } from '@components/others';
import { StorageKey } from '@enums';
import { useLessonReader } from '@hooks/lesson-reader.hook';
import { READER_SURFACE_ATTR, type ReaderEdge, useReaderGestures } from '@hooks/reader-gestures.hook';
import { CaretLeftIcon, CaretRightIcon, HandTapIcon } from '@phosphor-icons/react';
import { type IMaterial, useCourseStore, useSelectorLookups } from '@stores';
import { useEffect, useRef, useState } from 'react';
import { AttachmentContent } from './AttachmentContent';
import { ReaderProgress } from './ReaderProgress';

interface IProps {
  material: IMaterial;
  isFullScreen: boolean;
  onFullScreenChange: (isFullScreen: boolean) => void;
}

const isTouchScreen = () => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

/** The glow on the edge just tapped. Under the page and past pointer events, so it never steals a tap. */
const EdgeFlash = ({ edge }: { edge: ReaderEdge }) => (
  <div
    aria-hidden="true"
    className={cn(
      'pointer-events-none absolute inset-y-0 z-10 w-1/4 from-primary/40 to-transparent animate-tap-flash',
      edge === 'right' ? 'right-0 bg-gradient-to-l' : 'left-0 bg-gradient-to-r',
    )}
  />
);

/**
 * Shown once, on a touch screen, over the first page a learner opens: where to tap to turn. It
 * never catches a touch itself, and goes after the first turn or on its own after a few seconds.
 */
const TapHint = ({ onDone }: { onDone: () => void }) => {
  useEffect(() => {
    const timer = window.setTimeout(onDone, 6000);
    return () => window.clearTimeout(timer);
  }, []);
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-20 flex animate-fade-in">
      <div className="flex w-[28%] flex-col items-center justify-center gap-2 bg-foreground/10 text-foreground/70 backdrop-blur-[1px]">
        <CaretLeftIcon weight="bold" className="h-7 w-7" />
        <span className="text-xxs font-semibold uppercase tracking-caps">Back</span>
      </div>
      <div className="flex flex-1 items-end justify-center pb-6">
        <span className="flex items-center gap-2 whitespace-nowrap rounded-full bg-foreground/80 px-3 py-1.5 text-xs font-medium text-background shadow-lg animate-pop-in">
          <HandTapIcon weight="bold" className="h-4 w-4" />
          Tap the edges to turn
        </span>
      </div>
      <div className="flex w-[28%] flex-col items-center justify-center gap-2 bg-primary/15 text-primary backdrop-blur-[1px]">
        <CaretRightIcon weight="bold" className="h-7 w-7" />
        <span className="text-xxs font-semibold uppercase tracking-caps">Next</span>
      </div>
    </div>
  );
};

/**
 * Plays a page's arrival, then drops the animation. The class cannot stay: its final keyframe
 * leaves a `transform` on the wrapper, and a transformed ancestor becomes the containing block of
 * every `fixed` descendant, so the full-screen viewer inside the page would open inside the page.
 * For the same reason nothing is played while the viewer is full screen: the screen would be
 * pinned to the page box for the length of the animation and jump out of it after.
 */
const PageArrival = ({
  direction,
  isAnimated,
  children,
}: {
  direction: ReaderEdge;
  isAnimated: boolean;
  children: React.ReactNode;
}) => {
  // A page that mounts with nothing to play has nothing to play later either, so leaving full
  // screen does not slide the page that opened there.
  const [isArriving, setIsArriving] = useState(isAnimated);
  // Captured at mount: a re-render during the arrival must not swap the side it is coming from.
  const [arrival] = useState(() =>
    direction === 'right' ? 'motion-safe:animate-page-in-right' : 'motion-safe:animate-page-in-left',
  );
  return (
    <div
      className={cn('h-full w-full', isAnimated && isArriving && arrival)}
      onAnimationEnd={() => setIsArriving(false)}
    >
      {children}
    </div>
  );
};

/**
 * One page of the lesson at a time, turned by the pager, the progress strip, a tap on either edge
 * or the arrow keys. Opening a page is what counts as having read it; the swipe to complete waits
 * until every page has been opened once.
 */
export const TopicReader = ({ material, isFullScreen, onFullScreenChange }: IProps) => {
  const { pages, page, pageIndex, goToPage, goNext, goPrevious } = useLessonReader(material);
  const { selectedLessonPageIndex } = useSelectorLookups();
  const { handlers, flash, tapCount } = useReaderGestures({ onNext: goNext, onPrevious: goPrevious });
  // Where the last page was, so the new one knows which side to arrive from. Across lessons the
  // index says nothing, so the move that was asked for decides: the last page means going back.
  const last = useRef({ materialId: material._id, pageIndex });
  const isSameLesson = last.current.materialId === material._id;
  const isForward = isSameLesson ? pageIndex >= last.current.pageIndex : selectedLessonPageIndex !== 'last';
  const direction: ReaderEdge = isForward ? 'right' : 'left';
  // After commit, not during render: a render that runs twice (StrictMode) must read the same past.
  useEffect(() => {
    last.current = { materialId: material._id, pageIndex };
  }, [material._id, pageIndex]);
  const [isHintOpen, setIsHintOpen] = useState(false);

  useEffect(() => {
    if (isTouchScreen() && !localStorage.getItem(StorageKey.READER_HINT_SEEN)) setIsHintOpen(true);
  }, []);

  const dismissHint = () => {
    localStorage.setItem(StorageKey.READER_HINT_SEEN, '1');
    setIsHintOpen(false);
  };

  useEffect(() => {
    if (tapCount && isHintOpen) dismissHint();
  }, [tapCount]);

  useEffect(() => {
    if (page) useCourseStore.getState().markLessonPageViewed(material._id, page.key);
  }, [material._id, page?.key]);

  if (!page) {
    return (
      <BlankState
        className="h-full justify-center"
        label="Nothing here yet"
        description="This lesson has no written content or attachments."
      />
    );
  }

  return (
    <div className="flex h-full w-full flex-col">
      <ReaderProgress material={material} pages={pages} pageIndex={pageIndex} onPick={goToPage} />
      <div className="relative min-h-0 flex-1" {...{ [READER_SURFACE_ATTR]: '' }} {...handlers}>
        {flash ? <EdgeFlash edge={flash} /> : null}
        {isHintOpen ? <TapHint onDone={dismissHint} /> : null}
        {/* Keyed by page so each one mounts fresh, starts at its top and plays its arrival. */}
        <PageArrival key={`${material._id}:${page.key}`} direction={direction} isAnimated={!isFullScreen}>
          {page.kind === 'section' ? (
            <ViewTextContent
              content={page.content}
              isFullScreen={isFullScreen}
              onFullScreenChange={onFullScreenChange}
            />
          ) : (
            <AttachmentContent
              attachment={page.attachment}
              isFullScreen={isFullScreen}
              onFullScreenChange={onFullScreenChange}
            />
          )}
        </PageArrival>
      </div>
    </div>
  );
};
