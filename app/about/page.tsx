import Image from "next/image";

export default function AboutPage() {
  return (
    <>
      <section className="section">
        <div className="container hero">
          <div className="stack">
            <span className="hero-badge">About us</span>
            <h1 style={{ fontSize: 44, marginBottom: 12 }}>
              Cleaning that feels personal, every single visit.
            </h1>
            <p className="section-subtitle">
              Clean to the Macks is a residential cleaning team focused on
              consistent results, clear communication, and a welcoming experience
              for every household.
            </p>
            <div className="stack">
              <div className="card">
                <h3 style={{ marginBottom: 10 }}>Our Promise</h3>
                <p style={{ color: "var(--color-muted)" }}>
                  Every visit follows a detailed checklist and ends with a
                  walk-through to make sure your space feels refreshed.
                </p>
              </div>
              <div className="grid grid-3">
                <div className="stat">
                  <strong>7 days</strong>
                  <span style={{ color: "var(--color-muted)" }}>Flexible scheduling</span>
                </div>
                <div className="stat">
                  <strong>100%</strong>
                  <span style={{ color: "var(--color-muted)" }}>Satisfaction focus</span>
                </div>
                <div className="stat">
                  <strong>Local</strong>
                  <span style={{ color: "var(--color-muted)" }}>Community driven</span>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-2">
            <div className="image-card" style={{ minHeight: 220 }}>
              <Image
                src="/about-1.jpg"
                alt="Clean living space"
                width={800}
                height={420}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            <div className="image-card" style={{ minHeight: 220 }}>
              <Image
                src="/about-2.jpg"
                alt="Bright kitchen"
                width={800}
                height={420}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="section accent-band">
        <div className="container">
          <h2 className="section-title">Values</h2>
          <div className="grid grid-3" style={{ marginTop: 24 }}>
            {[
              {
                title: "Respect for your home",
                detail: "We treat your space with care and attention every visit.",
              },
              {
                title: "Consistency",
                detail: "Clear checklists, consistent quality, and dependable scheduling.",
              },
              {
                title: "Trust",
                detail: "A friendly crew that shows up prepared and on time.",
              },
            ].map((value) => (
              <div key={value.title} className="card">
                <h3 style={{ marginBottom: 8 }}>{value.title}</h3>
                <p style={{ color: "var(--color-muted)" }}>{value.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
