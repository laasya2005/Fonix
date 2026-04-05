import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SpeakClear — Pronunciation Coach",
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
        <div className="min-h-screen flex flex-col items-center">
          <header className="w-full py-5 text-center bg-white/60 backdrop-blur-sm border-b border-indigo-100">
            <h1 className="text-2xl font-bold text-indigo-900">SpeakClear</h1>
            <p className="text-sm text-indigo-500 mt-0.5">
              Your pronunciation coach
            </p>
          </header>
          <main className="w-full max-w-lg flex-1 py-6 px-0">{children}</main>
        </div>
      </body>
    </html>
  );
}
