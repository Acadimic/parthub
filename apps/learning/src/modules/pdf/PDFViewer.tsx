import { useRef } from 'react';
import { usePDF } from 'react-fast-scroll-pdf';

export const PDFViewer = ({ pdfUrl }: { pdfUrl: string }) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<HTMLDivElement | null>(null);
  const { pages, renderCurrentPage, changeZoomStart, changeZoomEnd } = usePDF({
    source: pdfUrl,
    scrollContainer: scrollContainerRef.current,
    viewer: viewerRef.current,
  });
  const url = 'https://parth-academic-images.s3.ap-south-1.amazonaws.com/609a1c94a33169eef05e5b97_1648840227000.pdf';

  return (
    <div>
      <div ref={scrollContainerRef} style={{ height: '500px', overflow: 'auto' }}>
        <div ref={viewerRef}>
          {pages?.map((page: { number: number }) => (
            <div key={page.number}>{renderCurrentPage(page.number)}</div>
          ))}
        </div>
      </div>

      {/* <ZoomButtons changeZoomStart={changeZoomStart} changeZoomEnd={changeZoomEnd} /> */}
    </div>
  );
};
