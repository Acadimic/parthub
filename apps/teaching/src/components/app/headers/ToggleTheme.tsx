import { ColorModeContext } from '@components/contexts';
import { Moon, Sun } from '@phosphor-icons/react';
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
      <button className="p-1 rounded hover:bg-background-secondary" onClick={colorMode.toggleColorMode}>
        {isDark ? (
          <Sun className="w-4 h-4 md:w-5 md:h-5 text-color-text" weight="bold" />
        ) : (
          <Moon className="w-4 h-4 md:w-5 md:h-5 text-color-text" weight="bold" />
        )}
      </button>
    </div>
  );
};
