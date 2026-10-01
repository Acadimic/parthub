import { useContext, useEffect, useState } from 'react';
import { ColorModeContext } from '../contexts';

/**
 * The current colour mode and the switch for it. `isDark` is read off the `dark` class on
 * `<html>`, which is the one source the provider and the stored preference agree on, so it starts
 * false on the server and settles on mount.
 */
export const useColorMode = () => {
  const [isDark, setIsDark] = useState(false);
  const { toggleColorMode } = useContext(ColorModeContext);

  useEffect(() => {
    const sync = () => setIsDark(document.documentElement.classList.contains('dark'));
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return { isDark, toggleColorMode };
};
