import * as React from 'react';

interface IProps {
  children: React.ReactNode;
  component: React.FC<{ handleClose?: () => void }>;
}

export const Popover = ({ children, component: Component }: IProps) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  const handleClick = () => {
    setIsOpen(!isOpen);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        handleClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={ref}>
      <div className="cursor-pointer" onClick={handleClick}>
        {children}
      </div>
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-50 bg-background border border-border rounded-sm shadow-lg">
          <Component handleClose={handleClose} />
        </div>
      )}
    </div>
  );
};
