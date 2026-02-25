import Image from "next/image";

interface GalleryItem {
  id: string;
  title: string;
  description?: string;
  beforeImageUrl: string;
  afterImageUrl: string;
}

async function getGalleryItems(): Promise<GalleryItem[]> {
  try {
    const base =
      process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const res = await fetch(`${base}/api/gallery`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.gallery || [];
  } catch {
    return [];
  }
}

const fallbackItems: GalleryItem[] = [
  {
    id: "1",
    title: "Living Room Reset",
    description: "",
    beforeImageUrl: "/work-before-1.jpg",
    afterImageUrl: "/work-after-1.jpg",
  },
  {
    id: "2",
    title: "Kitchen Refresh",
    description: "",
    beforeImageUrl: "/work-before-2.jpg",
    afterImageUrl: "/work-after-2.jpg",
  },
];

export default async function OurWorkPage() {
  const dynamicItems = await getGalleryItems();
  const items = dynamicItems.length > 0 ? dynamicItems : fallbackItems;

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
          <h2 className="section-title">Before &amp; After Highlights</h2>
          <p className="section-subtitle">
            Hover each card to see the transformation.
          </p>
          <div className="grid grid-2" style={{ marginTop: 24 }}>
            {items.map((item) => {
              const isExternal =
                item.beforeImageUrl.startsWith("http://") ||
                item.beforeImageUrl.startsWith("https://");
              return (
                <div key={item.id} className="card">
                  <div
                    className="before-after"
                    style={{ marginBottom: 14, position: "relative" }}
                  >
                    {isExternal ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.beforeImageUrl}
                          alt={`${item.title} before`}
                          style={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.afterImageUrl}
                          alt={`${item.title} after`}
                          className="after"
                          style={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      </>
                    ) : (
                      <>
                        <Image
                          src={item.beforeImageUrl}
                          alt={`${item.title} before`}
                          fill
                          style={{ objectFit: "cover" }}
                          sizes="(max-width: 900px) 100vw, 50vw"
                          priority={false}
                        />
                        <Image
                          src={item.afterImageUrl}
                          alt={`${item.title} after`}
                          fill
                          style={{ objectFit: "cover" }}
                          className="after"
                          sizes="(max-width: 900px) 100vw, 50vw"
                          priority={false}
                        />
                      </>
                    )}
                  </div>
                  <strong>{item.title}</strong>
                  {item.description && (
                    <p style={{ color: "var(--color-muted)", marginTop: 4 }}>
                      {item.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="grid grid-3">
            {[
              {
                title: "Recurring Cleanings",
                detail:
                  "Weekly, bi-weekly, or monthly care for busy households.",
              },
              {
                title: "Deep Cleans",
                detail:
                  "A detailed reset for kitchens, bathrooms, and high-traffic areas.",
              },
              {
                title: "Move-In / Move-Out",
                detail:
                  "A full refresh for empty homes before or after a move.",
              },
              {
                title: "Kitchen Focus",
                detail:
                  "Appliance exteriors, cabinet fronts, counters, and floors.",
              },
              {
                title: "Bath Refresh",
                detail:
                  "Tile, tubs, sinks, and fixtures polished and sanitized.",
              },
              {
                title: "Add-ons",
                detail:
                  "Inside fridge/oven, baseboards, windows, and more.",
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
