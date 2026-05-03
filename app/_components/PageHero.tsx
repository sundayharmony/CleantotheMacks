import type { ReactNode } from "react";

export default function PageHero({
  eyebrow,
  title,
  subtitle,
  primaryCta,
  secondaryCta,
  media,
  children,
  compact,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  primaryCta?: { href: string; label: string };
  secondaryCta?: { href: string; label: string };
  media?: ReactNode;
  children?: ReactNode;
  compact?: boolean;
}) {
  const content = (
    <div className="stack stack-lg">
      {eyebrow ? <span className="hero-eyebrow">{eyebrow}</span> : null}
      <h1 className="hero-title" style={compact ? { fontSize: "clamp(28px, 4vw, 42px)" } : undefined}>
        {title}
      </h1>
      {subtitle ? <p className="hero-lead">{subtitle}</p> : null}
      {(primaryCta || secondaryCta) && (
        <div className="row" style={{ gap: 12 }}>
          {primaryCta ? (
            <a className="btn btn-primary btn-lg" href={primaryCta.href}>
              {primaryCta.label}
            </a>
          ) : null}
          {secondaryCta ? (
            <a className="btn btn-outline btn-lg" href={secondaryCta.href}>
              {secondaryCta.label}
            </a>
          ) : null}
        </div>
      )}
      {children}
    </div>
  );

  return (
    <section className="section">
      <div className="container">
        {media ? (
          <div className="hero">
            {content}
            <div>{media}</div>
          </div>
        ) : (
          <div style={{ maxWidth: 760 }}>{content}</div>
        )}
      </div>
    </section>
  );
}
