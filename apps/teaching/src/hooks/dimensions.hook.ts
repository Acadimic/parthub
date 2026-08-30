import { IS_WINDOW_UNDEFINED } from '@utils/helpers';
import { useEffect, useState } from 'react';

const getWindowDimensions = () => {
  if (!IS_WINDOW_UNDEFINED) {
    const { innerWidth: width, innerHeight: height } = window;
    return {
      width,
      height,
    };
  }
  return { width: 0, height: 0 };
};

export const useWindowDimensions = () => {
  const [windowDimensions, setWindowDimensions] = useState<{ width: number; height: number }>(getWindowDimensions());

  useEffect(() => {
    function handleResize() {
      setWindowDimensions(getWindowDimensions());
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isLargeScreen = windowDimensions.width > 1024;
  const isMediumScreen = windowDimensions.width > 768 && windowDimensions.width <= 1024;
  const isSmallScreen = windowDimensions.width <= 768;

  return { ...windowDimensions, isLargeScreen, isMediumScreen, isSmallScreen };
};
