import type { Metadata } from 'next';
import { IBM_Plex_Mono, IBM_Plex_Sans, Libre_Baskerville } from 'next/font/google';
import { Toaster } from 'sonner';

import { AuthProvider } from '@/components/auth/auth-provider';
import { QueryProvider } from '@/components/providers/query-provider';

import './globals.css';

const displayFont = Libre_Baskerville({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
});

const plexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-plex-sans',
  display: 'swap',
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
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
