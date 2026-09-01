import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import Link from 'next/link';
import { Analytics } from '@vercel/analytics/next';
import { TrackLink } from '@/components/tracked-link';

export const metadata: Metadata = {
  title: 'Nexus-Index - Crossref Metadata Health',
  description:
    'A diagnostic benchmark of Crossref metadata health, with actionable recommendations for improvement.',
  openGraph: {
    title: 'Nexus-Index - Crossref Metadata Health',
    description: 'Explore Crossref metadata health across five diagnostic dimensions.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-E4LBN1GG4S"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-E4LBN1GG4S');
            `,
          }}
        />
      </head>
      <body className="flex min-h-screen flex-col bg-brand-paper font-brand-body text-brand-ink antialiased">
        <header className="sticky top-0 z-40 border-b border-brand-rule bg-brand-paper">
          <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-y-2 px-4 py-3 sm:px-6 lg:px-8">
            <Link href="/" className="flex shrink-0 items-center gap-3 rounded-md">
              <div className="relative flex h-8 w-8 items-center justify-center rounded-md bg-brand-foundation">
                <svg aria-hidden="true" className="h-5 w-5 text-brand-on-foundation" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <rect x="16" y="16" width="6" height="6" rx="1"/>
                  <rect x="2" y="16" width="6" height="6" rx="1"/>
                  <rect x="9" y="2" width="6" height="6" rx="1"/>
                  <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/>
                  <path d="M12 12V8"/>
                </svg>
                <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-brand-signal" aria-hidden="true" />
              </div>
              <span className="brand-wordmark hidden text-lg text-brand-ink sm:inline">Nexus-Index</span>
              <span className="brand-wordmark text-base text-brand-ink sm:hidden">Nexus-Index</span>
            </Link>
            <nav className="flex flex-wrap items-center gap-3 sm:gap-5" aria-label="Primary navigation">
              <Link
                href="/leaderboard"
                aria-label="Benchmark"
                className="flex min-h-11 items-center gap-1.5 rounded-md text-sm font-medium text-brand-primary decoration-brand-signal underline-offset-2 hover:underline"
              >
                <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 20V10"/>
                  <path d="M12 20V4"/>
                  <path d="M6 20v-6"/>
                </svg>
                <span className="hidden sm:inline">Benchmark</span>
              </Link>
              <Link
                href="/leaderboard/current/insights"
                aria-label="Insights"
                className="flex min-h-11 items-center gap-1.5 rounded-md text-sm font-medium text-brand-primary decoration-brand-signal underline-offset-2 hover:underline"
              >
                <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="16" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
                <span className="hidden sm:inline">Insights</span>
              </Link>
              <Link
                href="/about"
                aria-label="Methodology"
                className="flex min-h-11 items-center gap-1.5 rounded-md text-sm font-medium text-brand-primary decoration-brand-signal underline-offset-2 hover:underline"
              >
                <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                </svg>
                <span className="hidden sm:inline">Methodology</span>
              </Link>
              <TrackLink
                href="/gap-fixer"
                aria-label="Gap Fixer"
                event="gap_fixer_click"
                eventData={{ location: 'header_nav' }}
                className="flex min-h-11 items-center gap-1.5 rounded-md text-sm font-medium text-brand-primary decoration-brand-signal underline-offset-2 hover:underline"
              >
                <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                </svg>
                <span className="hidden sm:inline">Gap Fixer</span>
              </TrackLink>
              <a
                href="https://github.com/aadivar/nexus-score"
                aria-label="GitHub repository"
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-11 items-center gap-1.5 rounded-md text-sm font-medium text-brand-primary decoration-brand-signal underline-offset-2 hover:underline"
              >
                <svg aria-hidden="true" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                </svg>
                <span className="hidden sm:inline">GitHub</span>
              </a>
              <div
                data-fillout-id="8qawy5VMrmus"
                data-fillout-embed-type="slider"
                data-fillout-button-text="Contact Us"
                data-fillout-slider-direction="right"
                data-fillout-inherit-parameters=""
                data-fillout-popup-size="medium"
              />
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="mt-auto border-t border-brand-rule bg-brand-paper">
          <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-5 text-sm text-brand-neutral lg:flex-row lg:items-start lg:justify-between">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <span className="font-medium text-brand-ink">Built by Aadi Narayana Varma Dantuluri</span>
                <div className="flex items-center gap-2">
                  <a
                    href="https://www.linkedin.com/in/aadi-narayana-varma-dantuluri-62332b105/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded text-brand-neutral hover:text-brand-ink"
                    aria-label="LinkedIn"
                  >
                    <svg aria-hidden="true" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </a>
                  <a
                    href="https://github.com/aadivar"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded text-brand-neutral hover:text-brand-ink"
                    aria-label="GitHub"
                  >
                    <svg aria-hidden="true" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                    </svg>
                  </a>
                </div>
                <span className="text-brand-rule-2" aria-hidden="true">·</span>
                <Link href="/privacy" className="rounded decoration-brand-signal underline-offset-2 hover:text-brand-ink hover:underline">Privacy</Link>
                <Link href="/terms" className="rounded decoration-brand-signal underline-offset-2 hover:text-brand-ink hover:underline">Terms</Link>
              </div>
              <div className="max-w-2xl space-y-2 lg:text-right">
                <p>
                  Nexus-Index uses data from the{' '}
                <a
                  href="https://api.crossref.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="brand-link underline"
                >
                  Crossref REST API
                </a>
                . Not affiliated with Crossref.
                </p>
                <p className="text-xs text-brand-muted">
                  If you use or mention Nexus-Index, please{' '}
                <a
                  href="https://github.com/aadivar/nexus-score#citation"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="brand-link underline"
                >
                  cite this project
                </a>
                {' '}— DOI:{' '}
                <a
                  href="https://doi.org/10.5281/zenodo.19217245"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="brand-link underline"
                >
                  10.5281/zenodo.19217245
                </a>
                </p>
              </div>
            </div>
          </div>
        </footer>
        <Analytics />
        <Script src="https://server.fillout.com/embed/v1/" strategy="afterInteractive" />
      </body>
    </html>
  );
}
