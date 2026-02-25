import Image from "next/image";

type Testimonial = {
  id: string;
  name: string;
  quote: string;
  rating: number | null;
};

const fallbackTestimonials: Testimonial[] = [
  { id: "1", name: "Ashley R.", quote: "Every visit feels like a reset. Easy booking and great attention to detail.", rating: 5 },
  { id: "2", name: "Jordan L.", quote: "Professional, on time, and my home has never looked better.", rating: 5 },
  { id: "3", name: "Priya S.", quote: "Friendly crew and consistent quality. The best cleaning service we've used.", rating: 5 },
];

async function getTestimonials(): Promise<Testimonial[]> {
  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/testimonial`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return fallbackTestimonials;
    const data = await res.json();
    return data.testimonials?.length > 0 ? data.testimonials : fallbackTestimonials;
  } catch {
    return fallbackTestimonials;
  }
}

export default async function Home() {
  const services = [
    {
      title: "Standard Cleaning",
      detail: "Recurring or one-time visits for kitchens, baths, bedrooms, and living areas.",
    },
    {
      title: "Deep Cleaning",
      detail: "Detailed, top-to-bottom reset for move-ins, move-outs, or seasonal refresh.",
    },
    {
      title: "Add-on Focus",
      detail: "Appliance interiors, inside cabinets, baseboards, and more on request.",
    },
  ];

  const testimonials = await getTestimonials();

  return (
    <>
      <section className="section">
        <div className="container hero">
          <div className="stack">
            <span className="hero-badge">Trusted home cleaning</span>
            <h1 style={{ fontSize: 52, lineHeight: 1.05 }}>
              A spotless home, done right every time.
            </h1>
            <p className="section-subtitle">
              Book reliable residential cleaning with a friendly crew, clear
              communication, and professional results.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <a className="btn btn-primary" href="/book">
                Book a Cleaning
              </a>
              <a className="btn btn-outline" href="/our-work">
                View Our Work
              </a>
            </div>
            <div className="hero-panel">
              <div className="grid grid-3">
                <div className="stat">
                  <strong>500+</strong>
                  <span style={{ color: "var(--color-muted)" }}>Homes refreshed</span>
                </div>
                <div className="stat">
                  <strong>4.9&#9733;</strong>
                  <span style={{ color: "var(--color-muted)" }}>Client rating</span>
                </div>
                <div className="stat">
                  <strong>48hr</strong>
                  <span style={{ color: "var(--color-muted)" }}>Flexible booking</span>
                </div>
              </div>
            </div>
          </div>
          <div className="image-card" style={{ minHeight: 360 }}>
            <Image
              src="/hero.jpg"
              alt="Clean living room"
              width={1200}
              height={800}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              priority
            />
          </div>
        </div>
      </section>

      <section className="section accent-band">
        <div className="container">
          <h2 className="section-title">Services</h2>
          <p className="section-subtitle">
            Choose a plan that fits your home. We tailor every visit to the spaces
            that matter most.
          </p>
          <div className="grid grid-3" style={{ marginTop: 24 }}>
            {services.map((service) => (
              <div key={service.title} className="card">
                <h3 style={{ marginBottom: 8 }}>{service.title}</h3>
                <p style={{ color: "var(--color-muted)" }}>{service.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section-title">Testimonials</h2>
          <p className="section-subtitle">
            Homeowners trust us for consistent, high-quality cleaning.
          </p>
          <div className="grid grid-3" style={{ marginTop: 24 }}>
            {testimonials.map((item) => (
              <div key={item.id} className="card">
                {item.rating && (
                  <div style={{ marginBottom: 8, color: "#fbbf24" }}>
                    {"\u2605".repeat(item.rating)}{"\u2606".repeat(5 - item.rating)}
                  </div>
                )}
                <p style={{ marginBottom: 16, color: "var(--color-muted)" }}>
                  &ldquo;{item.quote}&rdquo;
                </p>
                <strong>{item.name}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ textAlign: "center" }}>
          <h2 className="section-title">Ready to book your clean?</h2>
          <p className="section-subtitle" style={{ margin: "0 auto 24px" }}>
            Tell us about your home and we&apos;ll take care of the rest.
          </p>
          <a className="btn btn-primary" href="/book">
            Book Now
          </a>
        </div>
      </section>
    </>
  );
}
