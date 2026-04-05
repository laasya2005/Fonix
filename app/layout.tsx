import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Clario — Pronunciation Coach",
  description:
    "Improve your American English pronunciation with AI-powered coaching",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased text-slate-800">
        <div className="min-h-screen flex flex-col">
          <header className="w-full py-4 text-center bg-white/80 backdrop-blur-sm border-b border-indigo-100 sticky top-0 z-40">
            <h1 className="text-xl font-bold text-indigo-900 tracking-tight">Clario</h1>
            <p className="text-[11px] text-indigo-400 mt-0.5">
              Your pronunciation coach
            </p>
          </header>
          <main className="w-full flex-1 flex flex-col">{children}</main>
        </div>
      </body>
    </html>
  );
}
