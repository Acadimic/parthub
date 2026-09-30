import { ErrorBoundaryFallback, FullScreenLoader, InternetStatus } from '@repo/ui/app';
import { useRequest } from '@repo/ui/hooks';
import { ColorModeContext } from '@repo/ui/contexts';
import { Layout, StorageKey, Theme, Subdomain } from '@enums';
import { AuthLayout, SidebarLayout } from '@layouts';
import { ToastContainer } from '@modules/toasts';
import { useStandardStore } from '@stores';
import '@styles/globals.scss';
import { loadFirebaseUser } from '@utils/firebase';
import { getToken, IS_WINDOW_UNDEFINED } from '@utils/helpers';
import type { NextPage } from 'next';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { type ErrorInfo, useEffect, useMemo, useState } from 'react';
import { withErrorBoundary } from 'react-error-boundary';

export type NextPageWithLayout<P = Record<string, unknown>, IP = P> = NextPage<P, IP> & {
  layout: string;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

type ThemeMode = 'light' | 'dark';

function App({ Component, pageProps }: AppPropsWithLayout) {
  // `useRequest` rather than `useLoadOnce`: the load is gated on a token and the layout below, not
  // simply on mount.
  const { isLoading: isLoadingInitialData } = useRequest(useStandardStore, 'initialData');
  const loadInitialData = useStandardStore((state) => state.loadInitialData);
  const { route, push } = useRouter();
  const { layout } = Component;
  const [isReady, setIsReady] = useState(false);
  const [mode, setMode] = useState<ThemeMode>();

  /**
   * Writes the theme to `<html>`, not just to React state. `_document.tsx` stamps the same
   * attribute before first paint; this keeps it in step on a toggle. Updating only the wrapper div
   * would leave `<body>`, the full-screen loader and the toast container on the previous theme,
   * because all three render outside it.
   */
  const setTheme = (currentTheme: ThemeMode) => {
    setMode(currentTheme);
    const element = document.documentElement;
    element.setAttribute('data-theme', currentTheme);
    if (currentTheme === Theme.DARK) element.classList.add('dark');
    else element.classList.remove('dark');
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
  }, []);

  useEffect(() => {
    if (!isReady) return;
    const token = getToken(Subdomain.SUPPORT);
    const redirectUri = encodeURIComponent(window.location.pathname + window.location.search);
    if (token) {
      if (layout === Layout.AUTH) {
        pushRoute('/home');
      } else if (useStandardStore.getState().shouldLoad('initialData')) {
        loadInitialData();
      }
    } else {
      if (!Object.values([Layout.AUTH, Layout.ERROR, Layout.NONE]).includes(layout as Layout)) {
        pushRoute('/signin', { redirectUri });
      }
    }
  }, [route, isReady]);

  if (!mode || !isReady) return null;

  // A protected page used to mount for the 200 ms before `pushRoute` sent the visitor to sign-in,
  // long enough for its `useLoadOnce` to fire a request with no token and toast a 401 over the
  // sign-in form. Hold the loader instead until the redirect lands.
  const isProtectedLayout = ![Layout.AUTH, Layout.ERROR, Layout.NONE].includes(layout as Layout);
  const isRedirectingToSignIn = isProtectedLayout && !getToken(Subdomain.SUPPORT);

  return (
    <>
      <Head>
        <title>Acadimic Support App</title>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
        <meta name="description" content="Acadimic Support App" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <ColorModeContext.Provider value={colorMode}>
        {isLoadingInitialData || !isReady || isRedirectingToSignIn ? (
          <FullScreenLoader loading={true} />
        ) : (
          <>
            <InternetStatus />
            <div data-theme={mode} className="bg-background text-foreground">
              {getLayout()}
            </div>
          </>
        )}
        <ToastContainer />
      </ColorModeContext.Provider>
    </>
  );
}

const AppWithErrorBoundary = withErrorBoundary(App, {
  FallbackComponent: ErrorBoundaryFallback,
  onError(error: Error, info: ErrorInfo) {
    console.error(error, info);
  },
});

export default AppWithErrorBoundary;
