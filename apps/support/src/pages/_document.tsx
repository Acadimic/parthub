import { StorageKey, Theme } from '@enums';
import { Head, Html, Main, NextScript } from 'next/document';

/**
 * Applies the stored theme before the first paint.
 *
 * Without it there is a window where the document has no `data-theme` at all, so every token falls
 * back to the `:root` block — which is the light palette — and a dark-mode user sees a white flash.
 * `_app.tsx` cannot close that window: it sets the theme from an effect, which runs after the
 * browser has already painted.
 *
 * It is stamped on `<html>` rather than on a wrapper div because `<body>` carries `bg-muted`, and
 * the full-screen loader and the toast container both render outside `_app`'s themed div. Anything
 * above or beside that div inherits from here.
 *
 * Kept inline and synchronous on purpose — a deferred or external script paints first and defeats
 * the point.
 */
const themeScript = `
(function () {
  try {
    var stored = localStorage.getItem('${StorageKey.THEME}');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = stored || (prefersDark ? '${Theme.DARK}' : '${Theme.LIGHT}');
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.toggle('dark', theme === '${Theme.DARK}');
  } catch (error) {
    // Private-mode browsers throw on localStorage. The :root default then applies, which is light.
  }
})();
`;

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </Head>
      <body className="bg-muted">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
