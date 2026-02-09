export default function OurWorkPage() {
  return (
    <>
      <section className="section">
        <div className="container">
          <h1 style={{ fontSize: 40, marginBottom: 12 }}>Our Work</h1>
          <p className="section-subtitle">
            We customize every visit based on your home and priorities.
          </p>
        </div>
      </section>

      <section className="section accent-band">
        <div className="container">
          <h2 className="section-title">Before & After Highlights</h2>
          <p className="section-subtitle">
            Hover each card to see the transformation.
          </p>
          <div className="grid grid-2" style={{ marginTop: 24 }}>
            {[
              {
                title: "Living Room Reset",
                before: "/work-before-1.jpg",
                after: "/work-after-1.jpg",
              },
              {
                title: "Kitchen Refresh",
                before: "/work-before-2.jpg",
                after: "/work-after-2.jpg",
              },
            ].map((item) => (
              <div key={item.title} className="card">
                <div className="before-after" style={{ marginBottom: 14 }}>
                  <img src={item.before} alt={`${item.title} before`} />
                  <img className="after" src={item.after} alt={`${item.title} after`} />
                </div>
                <strong>{item.title}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="grid grid-3">
            {[
              {
                title: "Recurring Cleanings",
                detail: "Weekly, bi-weekly, or monthly care for busy households.",
              },
              {
                title: "Deep Cleans",
                detail: "A detailed reset for kitchens, bathrooms, and high-traffic areas.",
              },
              {
                title: "Move-In / Move-Out",
                detail: "A full refresh for empty homes before or after a move.",
              },
              {
                title: "Kitchen Focus",
                detail: "Appliance exteriors, cabinet fronts, counters, and floors.",
              },
              {
                title: "Bath Refresh",
                detail: "Tile, tubs, sinks, and fixtures polished and sanitized.",
              },
              {
                title: "Add-ons",
                detail: "Inside fridge/oven, baseboards, windows, and more.",
              },
            ].map((service) => (
              <div key={service.title} className="card">
                <h3 style={{ marginBottom: 8 }}>{service.title}</h3>
                <p style={{ color: "var(--color-muted)" }}>{service.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
