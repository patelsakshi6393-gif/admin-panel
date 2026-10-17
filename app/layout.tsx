import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Rummy Adda - Gaming Admin Panel',
  description: 'Real-time Admin Panel for managing registered users, player profiles, deposits, withdrawals, approval workflows, and wallet balances.',
  openGraph: {
    title: 'Rummy Adda - Gaming Admin Panel',
    description: 'Real-time Admin Panel for managing registered users, player profiles, deposits, withdrawals, approval workflows, and wallet balances.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Rummy Adda - Gaming Admin Panel',
    description: 'Real-time Admin Panel for managing registered users, player profiles, deposits, withdrawals, approval workflows, and wallet balances.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
