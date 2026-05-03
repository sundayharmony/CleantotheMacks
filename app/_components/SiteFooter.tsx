"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SiteFooter() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin") && !pathname.startsWith("/admin/login")) return null;

  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer-grid">
          <div className="footer-col">
            <h4>Clean to the Macks</h4>
            <p className="footer-brand-text">
              Friendly, dependable residential cleaning and interior painting
              for homes across South Jersey and the Philadelphia metro.
            </p>
          </div>
          <div className="footer-col">
            <h4>Explore</h4>
            <ul>
              <li><Link href="/">Home</Link></li>
              <li><Link href="/about">About</Link></li>
              <li><Link href="/our-work">Our Work</Link></li>
              <li><Link href="/service-area">Service Area</Link></li>
              <li><Link href="/book">Book a Cleaning</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Account</h4>
            <ul>
              <li><Link href="/portal">Client Portal</Link></li>
              <li><Link href="/cleaner">Cleaner Portal</Link></li>
              <li><Link href="/admin">Admin</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>&copy; {year} Clean to the Macks. All rights reserved.</span>
          <span>Reliable residential cleaning in your area.</span>
        </div>
      </div>
    </footer>
  );
}
