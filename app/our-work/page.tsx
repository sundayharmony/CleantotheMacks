import PageHero from "../_components/PageHero";
import SectionBand from "../_components/SectionBand";
import FeatureCard from "../_components/FeatureCard";
import CtaBanner from "../_components/CtaBanner";
import BeforeAfter from "../_components/BeforeAfter";

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

const services: { title: string; detail: string; icon: "calendar" | "sparkle" | "home" | "kitchen" | "bath" | "plus" }[] = [
  { title: "Recurring Cleanings", detail: "Weekly, bi-weekly, or monthly care for busy households.", icon: "calendar" },
  { title: "Deep Cleans", detail: "A detailed reset for kitchens, bathrooms, and high-traffic areas.", icon: "sparkle" },
  { title: "Move-In / Move-Out", detail: "A full refresh for empty homes before or after a move.", icon: "home" },
  { title: "Kitchen Focus", detail: "Appliance exteriors, cabinet fronts, counters, and floors.", icon: "kitchen" },
  { title: "Bath Refresh", detail: "Tile, tubs, sinks, and fixtures polished and sanitized.", icon: "bath" },
  { title: "Add-ons", detail: "Inside fridge/oven, baseboards, windows, and more.", icon: "plus" },
];

export default async function OurWorkPage() {
  const dynamicItems = await getGalleryItems();
  const items = dynamicItems.length > 0 ? dynamicItems : fallbackItems;

  return (
    <>
      <PageHero
        eyebrow="Our work"
        title="See the difference, room by room."
        subtitle="Each visit is tailored to your home and priorities. Tap any photo to see the after."
        primaryCta={{ href: "/book", label: "Book a Cleaning" }}
      />

      <SectionBand
        title="Before & after highlights"
        subtitle="Real results from recent visits."
      >
        <div className="grid grid-2">
          {items.map((item) => (
            <div key={item.id} className="card stack-sm" style={{ gap: 14 }}>
              <BeforeAfter
                beforeUrl={item.beforeImageUrl}
                afterUrl={item.afterImageUrl}
                title={item.title}
              />
              <div>
                <strong style={{ fontSize: 16 }}>{item.title}</strong>
                {item.description ? (
                  <p className="text-muted" style={{ marginTop: 4, fontSize: 14 }}>
                    {item.description}
                  </p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </SectionBand>

      <SectionBand
        band={false}
        title="What we can do for your home"
        subtitle="Mix and match services so every visit feels just right."
      >
        <div className="grid grid-3">
          {services.map((service) => (
            <FeatureCard key={service.title} icon={service.icon} title={service.title} body={service.detail} />
          ))}
        </div>
      </SectionBand>

      <CtaBanner
        title="See your home transformed."
        subtitle="Tell us about your space and we'll match you with the right plan."
        primaryCta={{ href: "/book", label: "Book Now" }}
        secondaryCta={{ href: "/about", label: "About Us" }}
      />
    </>
  );
}
