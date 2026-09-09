import { useRef } from 'react';
import { usePDF } from 'react-fast-scroll-pdf';

export const PDFViewer = ({ pdfUrl }: { pdfUrl: string }) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<HTMLDivElement | null>(null);
  const { pages, renderCurrentPage } = usePDF({
    source: pdfUrl,
    scrollContainer: scrollContainerRef.current,
    viewer: viewerRef.current,
  });

  return (
    <div>
      <div ref={scrollContainerRef} style={{ height: '500px', overflow: 'auto' }}>
        <div ref={viewerRef}>
          {pages?.map((page: { number: number }) => (
            <div key={page.number}>{renderCurrentPage(page.number)}</div>
          ))}
        </div>
      </div>
    </div>
  );
};
