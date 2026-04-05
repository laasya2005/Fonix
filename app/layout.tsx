import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fonix — American Accent Coach",
  description:
    "Train your American English accent with AI-powered pronunciation coaching",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Fonix",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#faf9ff",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,500;0,9..144,700;0,9..144,800;1,9..144,400&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <div className="min-h-[100dvh] flex flex-col">
          <header className="w-full py-3.5 text-center safe-top sticky top-0 z-40" style={{ background: 'rgba(250,249,255,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: 700, color: 'var(--accent)', letterSpacing: '-0.02em' }}>
              Fonix
            </h1>
          </header>
          <main className="w-full flex-1 flex flex-col">{children}</main>
        </div>
      </body>
    </html>
  );
}
