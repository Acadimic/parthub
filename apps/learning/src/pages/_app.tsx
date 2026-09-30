import { ErrorBoundaryFallback, FullScreenLoader, InternetStatus } from '@repo/ui/app';
import { useRequest } from '@repo/ui/hooks';
import { ColorModeContext } from '@repo/ui/contexts';
import { Layout, StorageKey, Theme, Subdomain } from '@enums';
import { AuthLayout, PageLayout, PageNavigationLayout, PublicLayout, SidebarLayout, FocusLayout } from '@layouts';
import { ToastContainer } from '@modules/toasts';
import { useStandardStore, useUserLookups } from '@stores';
import '@styles/globals.scss';
// KaTeX's stylesheet hides its MathML twin of every equation; without it each formula shows twice.
import 'katex/dist/katex.min.css';
import { loadFirebaseUser } from '@utils/firebase';
import { getToken, IS_WINDOW_UNDEFINED } from '@utils/helpers';
import { MathJaxContext } from 'better-react-mathjax';
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
  const userStore = useUserLookups();
  const { loadLoggedInUsers } = userStore;
  // `useRequest` rather than `useLoadOnce`: both loads are gated below, not simply on mount.
  const initialData = useRequest(useStandardStore, 'initialData');
  const loadInitialData = useStandardStore((state) => state.loadInitialData);
  const loadPublicData = useStandardStore((state) => state.loadPublicData);
  const isLoadingLoggedInUsers = userStore.isLoading('loggedInUsers');
  const isLoadedLoggedInUsers = userStore.isLoaded('loggedInUsers');
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
      case Layout.PAGE:
        return (
          <PageLayout withTabBar={false}>
            <Component {...pageProps} />
          </PageLayout>
        );
      case Layout.PAGE_NAVIGATION:
        return (
          <PageNavigationLayout>
            <Component {...pageProps} />
          </PageNavigationLayout>
        );
      case Layout.PUBLIC:
        return (
          <PublicLayout>
            <Component {...pageProps} />
          </PublicLayout>
        );
      case Layout.FOCUS:
        return (
          <FocusLayout>
            <Component {...pageProps} />
          </FocusLayout>
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
    const token = getToken(Subdomain.LEARN);
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
    if (isLoadedLoggedInUsers && useStandardStore.getState().shouldLoad('initialData')) loadInitialData();
  }, [isLoadedLoggedInUsers, loadInitialData]);

  useEffect(() => {
    if (useStandardStore.getState().shouldLoad('publicData')) loadPublicData();
  }, [loadPublicData]);

  // A spinner rather than nothing: the sign-in and reference loads take long enough on a cold start
  // that a blank page reads as broken.
  if (!mode || !isReady || (isLoadedLoggedInUsers && !initialData.isLoaded)) return <FullScreenLoader loading />;

  return (
    <>
      <Head>
        <title>Acadimic App</title>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
        <meta name="description" content="Acadimic Learning App | Learn, Grow, Succeed | By Academic Courses" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <ColorModeContext.Provider value={colorMode}>
        <MathJaxContext config={config}>
          {isLoadingLoggedInUsers || !isReady ? (
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
        </MathJaxContext>
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
