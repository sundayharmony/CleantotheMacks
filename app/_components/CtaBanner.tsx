export default function CtaBanner({
  title,
  subtitle,
  primaryCta,
  secondaryCta,
}: {
  title: string;
  subtitle?: string;
  primaryCta: { href: string; label: string };
  secondaryCta?: { href: string; label: string };
}) {
  return (
    <section className="section section-tight">
      <div className="container">
        <div className="cta-banner">
          <div>
            <h2>{title}</h2>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <div className="row" style={{ gap: 12 }}>
            <a className="btn btn-primary btn-lg" href={primaryCta.href}>
              {primaryCta.label}
            </a>
            {secondaryCta ? (
              <a className="btn btn-outline btn-lg" href={secondaryCta.href}>
                {secondaryCta.label}
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
