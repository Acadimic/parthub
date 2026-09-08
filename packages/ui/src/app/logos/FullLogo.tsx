import { Theme } from '@repo/shared';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface IProps {
  className?: string;
}

export const FullLogo = ({ className }: IProps) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return (
    <div>
      <Link href="/" className="flex items-center">
        <img
          src={!isDark ? '/images/acadimic-light.svg' : '/images/acadimic-dark.svg'}
          alt="logo"
          className={className ? className : 'h-7'}
        />
      </Link>
    </div>
  );
};
