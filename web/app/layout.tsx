import { RootProvider } from 'fumadocs-ui/provider/next';
import localFont from 'next/font/local';
import type { Metadata } from 'next';
import './global.css';
import { appDescription, appName, appTagline } from '@/lib/shared';
import { palette } from '@/lib/palette';

// IBM's own hinted release of Plex, the same as uze.sh uses: Google serves an
// unhinted build that Windows renders with uneven strokes. OFL-1.1, beside them.
const sans = localFont({
  src: [
    { path: './fonts/IBMPlexSans-Regular.woff2', weight: '400' },
    { path: './fonts/IBMPlexSans-Medium.woff2', weight: '500' },
    { path: './fonts/IBMPlexSans-SemiBold.woff2', weight: '600' },
  ],
  variable: '--font-body',
});

const mono = localFont({
  src: [
    { path: './fonts/IBMPlexMono-Regular.woff2', weight: '400' },
    { path: './fonts/IBMPlexMono-Medium.woff2', weight: '500' },
    { path: './fonts/IBMPlexMono-SemiBold.woff2', weight: '600' },
    { path: './fonts/IBMPlexMono-Bold.woff2', weight: '700' },
  ],
  variable: '--font-ui-mono',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: `${appName} · ${appTagline}`,
    template: `%s · ${appName}`,
  },
  description: appDescription,
};

/*
  Runs before first paint, so a chosen palette never flashes the default one
  first. `?palette=<name>` picks and remembers one; `?palette=` with no value
  clears the choice and returns to what the site ships with. Anything the
  palettes list doesn't contain is ignored rather than stamped, so a typo shows
  the default instead of an unstyled page.
*/
const paletteScript = `
(function () {
  try {
    var shipped = ${JSON.stringify(palette)};
    var known = ${JSON.stringify(['amber', 'periwinkle', 'terracotta', 'violet'])};
    var url = new URL(location.href);
    var chosen = null;
    if (url.searchParams.has('palette')) {
      var asked = url.searchParams.get('palette');
      if (asked === '') localStorage.removeItem('ai:palette');
      else if (known.indexOf(asked) !== -1) localStorage.setItem('ai:palette', (chosen = asked));
    }
    if (!chosen) {
      var saved = localStorage.getItem('ai:palette');
      if (known.indexOf(saved) !== -1) chosen = saved;
    }
    document.documentElement.dataset.palette = chosen || shipped;
  } catch (e) {
    /* private mode, blocked storage, a malformed URL. The shipped palette is
       already on <html> from the server, so there is nothing to recover. */
  }
})();
`;

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      data-palette={palette}
      className={`${sans.variable} ${mono.variable} scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent scrollbar-thumb-rounded-full`}
      suppressHydrationWarning
    >
      <head>
        {/* biome-ignore lint: authored here, not user input, see paletteScript */}
        <script dangerouslySetInnerHTML={{ __html: paletteScript }} />
      </head>
      <body className="flex flex-col min-h-screen font-sans">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
