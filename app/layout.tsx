import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { Toaster } from 'sonner';

import { AuthProvider } from '@/components/auth/auth-provider';
import { QueryProvider } from '@/components/providers/query-provider';
import { DevBfcacheGuard } from '@/components/providers/dev-bfcache-guard';

import 'katex/dist/katex.min.css';

import './globals.css';

// Fonts are vendored under app/fonts so production builds never reach the network.
const displayFont = localFont({
  src: [
    { path: './fonts/LibreBaskerville-normal.woff2', weight: '400 700', style: 'normal' },
    { path: './fonts/LibreBaskerville-italic.woff2', weight: '400 700', style: 'italic' },
  ],
  variable: '--font-display',
  display: 'swap',
});

const plexSans = localFont({
  src: './fonts/IBMPlexSans-normal.woff2',
  weight: '400 600',
  variable: '--font-plex-sans',
  display: 'swap',
});

const plexMono = localFont({
  src: [
    { path: './fonts/IBMPlexMono-400.woff2', weight: '400', style: 'normal' },
    { path: './fonts/IBMPlexMono-500.woff2', weight: '500', style: 'normal' },
  ],
  variable: '--font-plex-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'TeachAI · 备课桌',
    template: '%s · TeachAI',
  },
  description: '把一节课，写成可以走进去的空间。',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang='zh-CN'
      className={`${displayFont.variable} ${plexSans.variable} ${plexMono.variable}`}
    >
      <head>
        <meta name='theme-color' content='#091713' />
        <meta name='viewport' content='width=device-width, initial-scale=1' />
      </head>
      <body>
        <DevBfcacheGuard />
        <QueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </QueryProvider>
        <Toaster
          position='top-center'
          toastOptions={{
            classNames: {
              toast: '!border-chalk/10 !bg-ink !font-sans !text-paper',
              description: '!text-paper/60',
            },
          }}
        />
      </body>
    </html>
  );
}
