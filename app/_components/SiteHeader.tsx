"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/our-work", label: "Our Work" },
  { href: "/service-area", label: "Service Area" },
  { href: "/portal", label: "Client Portal" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  if (pathname?.startsWith("/admin") && !pathname.startsWith("/admin/login")) return null;

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <header className="site-header-bar">
      <div className="container site-header">
        <Link href="/" className="site-brand" aria-label="Clean to the Macks home">
          <Image
            src="/logo.png"
            alt="Clean to the Macks"
            width={132}
            height={80}
            priority
            style={{ width: "auto", height: 56 }}
          />
        </Link>

        <nav className="nav" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={isActive(link.href) ? "active" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="header-cta">
          <Link href="/book" className="btn btn-primary btn-cta-desktop">
            Book Now
          </Link>
          <button
            type="button"
            className="header-hamburger"
            aria-label="Open menu"
            aria-expanded={open}
            aria-controls="mobile-drawer"
            onClick={() => setOpen(true)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {open ? (
        <>
          <div
            className="drawer-backdrop"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <aside
            id="mobile-drawer"
            className={`mobile-drawer${open ? " open" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
          >
            <div className="drawer-head">
              <strong style={{ fontSize: 14 }}>Menu</strong>
              <button
                type="button"
                className="header-hamburger"
                style={{ display: "inline-flex" }}
                aria-label="Close menu"
                onClick={() => setOpen(false)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M6 6l12 12M6 18 18 6" />
                </svg>
              </button>
            </div>
            <nav className="nav" aria-label="Mobile">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={isActive(link.href) ? "active" : undefined}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="drawer-cta">
              <Link href="/book" className="btn btn-primary btn-block">
                Book Now
              </Link>
            </div>
          </aside>
        </>
      ) : null}
    </header>
  );
}
