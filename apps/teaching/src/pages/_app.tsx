import { ErrorBoundaryFallback, FullScreenLoader, InternetStatus } from '@repo/ui/app';
import { ColorModeContext } from '@repo/ui/contexts';
import { Layout, StorageKey, Theme } from '@enums';
import { AuthLayout, SidebarLayout } from '@layouts';
import { ToastContainer } from '@modules/toasts';
import { useStores } from '@stores';
import '@styles/calendar.scss';
import '@styles/globals.scss';
import { loadFirebaseUser } from '@utils/firebase';
import { getToken, IS_WINDOW_UNDEFINED } from '@utils/helpers';
import { MathJaxContext } from 'better-react-mathjax';
import { observer } from 'mobx-react-lite';
import type { NextPage } from 'next';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ErrorInfo, useEffect, useMemo, useState } from 'react';
import { withErrorBoundary } from 'react-error-boundary';

export type NextPageWithLayout<P = Record<string, unknown>, IP = P> = NextPage<P, IP> & {
  layout: string;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

const config = {
  tex: {
    inlineMath: [
      ['$', '$'],
      ['\\(', '\\)'],
    ],
    displayMath: [
      ['$$', '$$'],
      ['\\[', '\\]'],
    ],
  },
};

type ThemeMode = 'light' | 'dark';

function App({ Component, pageProps }: AppPropsWithLayout) {
  const { userStore } = useStores();
  const { isLoadingLoggedInUsers, isLoadedLoggedInUsers, loadLoggedInUsers } = userStore;
  const { route, push } = useRouter();
  const { layout } = Component;
  const [isReady, setIsReady] = useState(false);
  const [mode, setMode] = useState<ThemeMode>();

  const setTheme = (currentTheme: ThemeMode) => {
    setMode(currentTheme);
    if (currentTheme === Theme.DARK) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  };

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        const newMode = mode === Theme.DARK ? Theme.LIGHT : Theme.DARK;
        localStorage.setItem(StorageKey.THEME, newMode);
        setTheme(newMode);
      },
    }),
    [mode],
  );

  const getLayout = () => {
    switch (layout) {
      case Layout.AUTH:
        return (
          <AuthLayout>
            <Component {...pageProps} />
          </AuthLayout>
        );
      case Layout.SIDEBAR:
        return (
          <SidebarLayout>
            <Component {...pageProps} />
          </SidebarLayout>
        );
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
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const selectedTheme = localStorage.getItem(StorageKey.THEME) as ThemeMode | null;
    const systemMode: ThemeMode = prefersDarkMode ? Theme.DARK : Theme.LIGHT;
    const currentTheme: ThemeMode = selectedTheme || systemMode;
    setTheme(currentTheme);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      const stored = localStorage.getItem(StorageKey.THEME) as ThemeMode | null;
      if (!stored) {
        setTheme(e.matches ? Theme.DARK : Theme.LIGHT);
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (!IS_WINDOW_UNDEFINED) loadCurrentUser();
  }, [IS_WINDOW_UNDEFINED]);

  useEffect(() => {
    if (!isReady) return;
    const token = getToken();
    const redirectUri = encodeURIComponent(window.location.pathname + window.location.search);
    if (token) {
      if (layout === Layout.AUTH) {
        pushRoute('/home');
      } else if (!isLoadingLoggedInUsers && !isLoadedLoggedInUsers) {
        loadLoggedInUsers();
      }
    } else {
      if (!Object.values([Layout.AUTH, Layout.ERROR, Layout.NONE]).includes(layout as Layout)) {
        pushRoute('/sign-in', { redirectUri });
      }
    }
    console.log('###route: ', route, isReady);
  }, [route, isReady]);

  if (!mode || !isReady) return null;

  return (
    <>
      <Head>
        <title>Acadimic Teaching App</title>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
        <meta name="description" content="Acadimic Teaching App - Create, manage and share your teaching courses" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <ColorModeContext.Provider value={colorMode}>
        <MathJaxContext config={config}>
          {isLoadingLoggedInUsers || !isReady ? (
            <FullScreenLoader loading={true} />
          ) : (
            <>
              <InternetStatus />
              <div data-theme={mode}>{getLayout()}</div>
            </>
          )}
          <ToastContainer />
        </MathJaxContext>
      </ColorModeContext.Provider>
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
