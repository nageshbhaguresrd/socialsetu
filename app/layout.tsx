import type {Metadata} from 'next';
import { Inter, Poppins, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const poppins = Poppins({
  weight: ['400', '500', '600', '700', '800'],
  subsets: ['latin'],
  variable: '--font-poppins',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'SocialSetu - #1 Social Media Marketing Agency in India',
  description: 'India\'s Growth Partner — From Kashmir to Kanyakumari. We specialize in Social Media Management, Meta Ads, and Regional Content for brands across India.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${poppins.variable} ${jetbrainsMono.variable}`}>
      <body suppressHydrationWarning className="antialiased">{children}</body>
    </html>
  );
}
