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
        <div className="min-h-screen flex flex-col items-center px-4 py-8">
          <header className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-indigo-900">SpeakClear</h1>
            <p className="text-sm text-indigo-500 mt-1">
              Your pronunciation coach
            </p>
          </header>
          <main className="w-full max-w-md">{children}</main>
        </div>
      </body>
    </html>
  );
}
