import { ErrorBoundaryFallback, FullScreenLoader, InternetStatus } from '@repo/ui/app';
import { configureMathLive } from '@repo/ui/core';
import { ColorModeContext, RichTextMediaContext } from '@repo/ui/contexts';
import { useRichTextMediaValue } from '@hooks/rich-text-media.hook';
import { Layout, StorageKey, Theme, Subdomain } from '@enums';
import { AuthLayout, SidebarLayout } from '@layouts';
import { ToastContainer } from '@modules/toasts';
import { useUserLookups } from '@stores';
import '@styles/calendar.scss';
import '@styles/globals.scss';
// Global CSS from node_modules can only be imported here: the Pages Router rejects it from any
// other file. Next rewrites the font URLs inside it, so the woff2 files need no manual copy.
import 'katex/dist/katex.min.css';
// The printouts' embedded face; only the print pages use the family it declares.
import '@repo/ui/print/print-font.css';
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

/**
 * MathLive resolves its font directory relative to the script URL, which under Next lands inside
 * `/_next/static/chunks` where the fonts are not — and it fails silently, rendering in a fallback
 * face rather than erroring. The files are copied to `public/mathlive/fonts`; keep the two in step
 * when upgrading mathlive. Sounds are off: no screen in this product wants keypress audio.
 */
configureMathLive({ fontsDirectory: '/mathlive/fonts', soundsDirectory: null });

type ThemeMode = 'light' | 'dark';

function App({ Component, pageProps }: AppPropsWithLayout) {
  const userStore = useUserLookups();
  const { loadLoggedInUsers } = userStore;
  const isLoadingLoggedInUsers = userStore.isLoading('loggedInUsers');
  const isLoadedLoggedInUsers = userStore.isLoaded('loggedInUsers');
  const { route, push } = useRouter();
  const { layout } = Component;
  const [isReady, setIsReady] = useState(false);
  // A signed-in request without an organization is refused, and a page's effects run before this
  // component's, so with a session the page waits until the login data has picked the org. AUTH
  // pages are left alone: they redirect instead of loading it, so the wait would never end.
  const isAwaitingOrganization =
    isReady &&
    !!getToken(Subdomain.TEACH) &&
    layout !== Layout.AUTH &&
    !isLoadedLoggedInUsers &&
    !userStore.getError('loggedInUsers');
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

  const richTextMedia = useRichTextMediaValue();
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
    const token = getToken(Subdomain.TEACH);
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
        <RichTextMediaContext.Provider value={richTextMedia}>
          {isLoadingLoggedInUsers || !isReady || isAwaitingOrganization ? (
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
        </RichTextMediaContext.Provider>
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
