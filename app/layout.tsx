import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://socialsetu.vercel.app'),
  title: 'SocialSetu - #1 Social Media Marketing Agency in India',
  description: "India's Growth Partner — From Kashmir to Kanyakumari. We specialize in Social Media Management, Meta Ads, and Regional Content for brands across India.",
  keywords: ['social media marketing', 'digital marketing India', 'meta ads', 'regional content', 'socialsetu'],
  openGraph: {
    title: 'SocialSetu - #1 Social Media Marketing Agency in India',
    description: "India's Growth Partner — From Kashmir to Kanyakumari.",
    url: 'https://socialsetu.com',
    siteName: 'SocialSetu',
    images: [{ url: '/og-image.jpg' }],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SocialSetu - #1 Social Media Marketing Agency in India',
    description: "India's Growth Partner — From Kashmir to Kanyakumari.",
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};


export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className="antialiased">{children}</body>
    </html>
  );
}
