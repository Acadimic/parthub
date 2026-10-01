import { MoonIcon, SunIcon } from '@phosphor-icons/react';
import { useColorMode } from '../../hooks';

export const ToggleTheme = () => {
  const { isDark, toggleColorMode } = useColorMode();

  return (
    <div className="relative">
      <button className="p-1 rounded hover:bg-accent" onClick={toggleColorMode}>
        {isDark ? (
          <SunIcon className="w-4 h-4 md:w-5 md:h-5 text-foreground" weight="bold" />
        ) : (
          <MoonIcon className="w-4 h-4 md:w-5 md:h-5 text-foreground" weight="bold" />
        )}
      </button>
    </div>
  );
};
