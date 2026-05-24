import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title:       'Helix Stocks — AI-Powered Stock Analysis',
  description: 'Bloomberg-grade stock analysis with institutional data, AI ratings, and portfolio tracking.',
  icons:       { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
