import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Clario — Pronunciation Coach",
  description:
    "Improve your American English pronunciation with AI-powered coaching",
  manifest: undefined,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Clario",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased text-slate-800 overscroll-none">
        <div className="min-h-[100dvh] flex flex-col">
          <header className="w-full py-3 text-center bg-white/80 backdrop-blur-sm border-b border-indigo-100 sticky top-0 z-40 safe-top">
            <h1 className="text-lg font-bold text-indigo-900 tracking-tight">Clario</h1>
            <p className="text-[10px] text-indigo-400">
              Your pronunciation coach
            </p>
          </header>
          <main className="w-full flex-1 flex flex-col">{children}</main>
        </div>
      </body>
    </html>
  );
}
