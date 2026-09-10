import { ColorModeContext } from '../../contexts';
import { MoonIcon, SunIcon } from '@phosphor-icons/react';
import { useContext, useEffect, useState } from 'react';

export const ToggleTheme = () => {
  const [isDark, setIsDark] = useState(false);
  const colorMode = useContext(ColorModeContext);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative">
      <button className="p-1 rounded hover:bg-accent" onClick={colorMode.toggleColorMode}>
        {isDark ? (
          <SunIcon className="w-4 h-4 md:w-5 md:h-5 text-foreground" weight="bold" />
        ) : (
          <MoonIcon className="w-4 h-4 md:w-5 md:h-5 text-foreground" weight="bold" />
        )}
      </button>
    </div>
  );
};
