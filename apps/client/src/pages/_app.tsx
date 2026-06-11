import { ErrorBoundaryFallback, FullScreenLoader } from '@components/app';
import { ColorModeContext } from '@components/contexts/color-mode-context';
import { InternetStatus } from '@components/others';
import { Layout, StorageKey, Theme } from '@enums';
import { AuthLayout, PageLayout, PublicLayout, SidebarLayout } from '@layouts';
import { ToastContainer } from '@modules/toasts';
import { PaletteMode } from '@mui/material';
import { AppCacheProvider } from '@mui/material-nextjs/v14-pagesRouter';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useStores } from '@stores';
import '@styles/globals.scss';
import { getTheme } from '@themes';
import { loadFirebaseUser } from '@utils/firebase';
import { getToken, IS_WINDOW_UNDEFINED } from '@utils/helpers';
import { observer } from 'mobx-react-lite';
import type { NextPage } from 'next';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ErrorInfo, useEffect, useMemo, useState } from 'react';
import { withErrorBoundary } from 'react-error-boundary';

export type NextPageWithLayout<P = any, IP = P> = NextPage<P, IP> & {
  layout: string;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

function App({ Component, pageProps }: AppPropsWithLayout) {
  const {
    userStore,
    isLoadingInitialData,
    isLoadedInitialData,
    isLoadedPublicData,
    isLoadingPublicData,
    loadInitialData,
    loadPublicData,
  } = useStores();
  const { isLoadingLoggedInUsers, isLoadedLoggedInUsers, loadLoggedInUsers } = userStore;
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const { route, push } = useRouter();
  const { layout } = Component;
  const [isReady, setIsReady] = useState(false);

  const setThemeMode = (currentTheme: PaletteMode) => {
    setMode(currentTheme);
    if (currentTheme === Theme.DARK) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  };

  const [mode, setMode] = useState<PaletteMode>();

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        const newMode = mode === Theme.DARK ? Theme.LIGHT : Theme.DARK;
        localStorage.setItem(StorageKey.THEME, newMode);
        setThemeMode(newMode);
      },
    }),
    [mode],
  );

  const theme = useMemo(() => {
    if (mode) return createTheme(getTheme(mode));
  }, [mode]);

  const getLayout = () => {
    switch (layout) {
      case Layout.AUTH:
        return <AuthLayout><Component {...pageProps} /></AuthLayout>;
      case Layout.SIDEBAR:
        return <SidebarLayout><Component {...pageProps} /></SidebarLayout>;
      case Layout.PAGE:
        return <PageLayout><Component {...pageProps} /></PageLayout>;
      case Layout.PUBLIC:
        return <PublicLayout><Component {...pageProps} /></PublicLayout>;
      default:
        return <Component {...pageProps} />;
    }
  };

  const loadCurrentUser = async () => {
    await loadFirebaseUser();
    setIsReady(true);
  };

  const pushRoute = (url: string, obj = {}) => {
    setTimeout(() => {
      push({ pathname: url, query: { ...obj } }, undefined, { shallow: true });
    }, 200);
  };

  useEffect(() => {
    const selectedTheme = localStorage.getItem(StorageKey.THEME) as PaletteMode;
    const systemMode: PaletteMode = prefersDarkMode ? Theme.DARK : Theme.LIGHT;
    const currentTheme: PaletteMode = selectedTheme || systemMode;
    setThemeMode(currentTheme);
  }, [prefersDarkMode]);

  useEffect(() => {
    if (!IS_WINDOW_UNDEFINED) loadCurrentUser();
  }, [IS_WINDOW_UNDEFINED]);

  useEffect(() => {
    if (!isReady) return;
    const token = getToken();
    const redirectUri = encodeURIComponent(window.location.pathname + window.location.search);
    if (token) {
      if (layout === Layout.AUTH) {
        pushRoute('/');
      } else if (!isLoadingLoggedInUsers && !isLoadedLoggedInUsers) {
        loadLoggedInUsers();
      }
    } else {
      if (!Object.values([Layout.AUTH, Layout.ERROR, Layout.NONE, Layout.PUBLIC]).includes(layout as Layout)) {
        pushRoute('/sign-in', { redirectUri });
      }
    }
  }, [route, isReady]);

  useEffect(() => {
    if (!isLoadedInitialData && !isLoadingInitialData && isLoadedLoggedInUsers) loadInitialData();
  }, [isLoadedInitialData, isLoadingInitialData, isLoadedLoggedInUsers]);

  useEffect(() => {
    if (!isLoadedPublicData && !isLoadingPublicData) loadPublicData();
  }, [isLoadedPublicData, isLoadingPublicData]);

  if (!theme || !isReady || (isLoadedLoggedInUsers && !isLoadedInitialData)) return null;

  return (
    <>
      <Head>
        <title>ParthHub</title>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
        <meta name="description" content="ParthHub - Learn, Grow, Succeed" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <AppCacheProvider {...pageProps}>
        <ColorModeContext.Provider value={colorMode}>
          <ThemeProvider theme={theme}>
            {isLoadingLoggedInUsers || !isReady ? (
              <FullScreenLoader loading={true} />
            ) : (
              <>
                <InternetStatus />
                <div data-theme={mode}>{getLayout()}</div>
              </>
            )}
            <ToastContainer />
          </ThemeProvider>
        </ColorModeContext.Provider>
      </AppCacheProvider>
    </>
  );
}

const AppWithErrorBoundary = withErrorBoundary(observer(App), {
  FallbackComponent: ErrorBoundaryFallback,
  onError(error: Error, info: ErrorInfo) {
    console.log(error, info);
  },
});

export default AppWithErrorBoundary;
