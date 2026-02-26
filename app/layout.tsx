import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Clean to the Macks",
  description: "Professional residential cleaning services.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <header
          style={{
            background: "var(--color-surface)",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <div
            className="container site-header"
            style={{
              alignItems: "center",
              padding: "10px 0",
              gap: 16,
            }}
          >
            <Link
              href="/"
              style={{ display: "flex", alignItems: "center", gap: 12 }}
            >
              <Image
                src="/logo.png"
                alt="Clean to the Macks"
                width={132}
                height={80}
                style={{ height: "auto" }}
                priority
              />
            </Link>
            <nav className="nav">
              <Link href="/">Home</Link>
              <Link href="/about">About</Link>
              <Link href="/our-work">Our Work</Link>
              <Link href="/service-area">Service Area</Link>
              <Link href="/portal">Client Portal</Link>
            </nav>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Link className="btn btn-primary" href="/book">
                Book Now
              </Link>
            </div>
          </div>
        </header>
        <main>{children}</main>
        <footer
          style={{
            borderTop: "1px solid var(--color-border)",
            padding: "28px 0",
            marginTop: 40,
            background: "var(--color-surface-2)",
          }}
        >
          <div
            className="container"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
              color: "var(--color-muted)",
            }}
          >
            <span>Clean to the Macks</span>
            <span>Reliable residential cleaning in your area.</span>
            <div style={{ display: "flex", gap: 16 }}>
              <Link href="/cleaner" style={{ color: "var(--color-muted)" }}>
                Cleaner Portal
              </Link>
              <Link href="/admin" style={{ color: "var(--color-muted)" }}>
                Admin
              </Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
