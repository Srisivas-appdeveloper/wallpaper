import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/Sidebar';

export const metadata: Metadata = {
  title: 'DOTSCAPE Studio — Cloud Admin',
  description: 'Nothing OS Dot-Matrix Wallpaper Cloud Studio & Management Portal',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background bg-dot-matrix text-foreground antialiased selection:bg-nothing-red selection:text-white">
        <Sidebar />
        <div className="pl-64 flex flex-col min-h-screen">
          <main className="flex-1 pb-16">{children}</main>
        </div>
      </body>
    </html>
  );
}
