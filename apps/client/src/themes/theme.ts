import { PaletteMode } from '@mui/material';
import { dark, light } from '.';

export const getTheme = (mode: PaletteMode) => {
  const theme = mode === 'light' ? light : dark;
  return {
    palette: {
      mode,
      ...theme,
      primary: {
        main: theme.colors.blue.primary,
        light: theme.colors.blue.secondary,
        dark: theme.colors.blue.dark,
      },
      background: {
        default: theme.colors.background.primary,
        paper: theme.colors.background.secondary,
      },
      divider: theme.colors.color.border,
    },
    typography: {
      fontFamily: [
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
      ].join(','),
      fontWeightMedium: 500,
      fontWeightBold: 700,
    },
  };
};
