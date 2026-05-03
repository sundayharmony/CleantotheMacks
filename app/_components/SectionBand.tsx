import type { ReactNode } from "react";

export default function SectionBand({
  title,
  subtitle,
  children,
  band = true,
  centered,
  actions,
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  band?: boolean;
  centered?: boolean;
  actions?: ReactNode;
}) {
  return (
    <section className={`section${band ? " section-band" : ""}`}>
      <div className="container">
        {title || subtitle ? (
          <div
            className="stack stack-sm"
            style={{
              marginBottom: 28,
              textAlign: centered ? "center" : undefined,
              maxWidth: centered ? 720 : undefined,
              marginLeft: centered ? "auto" : undefined,
              marginRight: centered ? "auto" : undefined,
            }}
          >
            {title ? <h2 className="section-title" style={{ marginBottom: 0 }}>{title}</h2> : null}
            {subtitle ? <p className="section-subtitle">{subtitle}</p> : null}
            {actions ? <div className="row" style={{ marginTop: 12, justifyContent: centered ? "center" : "flex-start" }}>{actions}</div> : null}
          </div>
        ) : null}
        {children}
      </div>
    </section>
  );
}
