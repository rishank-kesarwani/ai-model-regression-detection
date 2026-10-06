import React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
import { LoginModal } from '@/components/LoginModal';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AI Model Regression Detection & Evaluation Platform',
  description: 'Production-grade platform for continuous regression detection and benchmark evaluation in LLM systems.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-background text-slate-100 antialiased`}>
        <AuthProvider>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <div className="flex flex-1 overflow-hidden">
              <Sidebar />
              <main className="flex-1 overflow-y-auto p-6 md:p-8">
                {children}
              </main>
            </div>
          </div>
          <LoginModal />
        </AuthProvider>
      </body>
    </html>
  );
}
