import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AidBridge',
  description: 'Nền tảng điều phối cứu trợ hai chiều',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
