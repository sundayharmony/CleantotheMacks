import Image from "next/image";
import PageHero from "../_components/PageHero";
import StatStrip from "../_components/StatStrip";
import SectionBand from "../_components/SectionBand";
import FeatureCard from "../_components/FeatureCard";
import CtaBanner from "../_components/CtaBanner";

const promises: { title: string; detail: string; icon: "shield" | "heart" | "clock" }[] = [
  {
    title: "Detailed checklist",
    detail: "Every visit follows a clear room-by-room checklist with a final walk-through.",
    icon: "shield",
  },
  {
    title: "Friendly crew",
    detail: "Background-checked, friendly cleaners who treat your home with care.",
    icon: "heart",
  },
  {
    title: "On time, every time",
    detail: "Clear communication, on-time arrivals, and reliable scheduling.",
    icon: "clock",
  },
];

const values: { title: string; detail: string; icon: "home" | "sparkle" | "users" }[] = [
  {
    title: "Respect for your home",
    detail: "We treat your space with care and attention every visit.",
    icon: "home",
  },
  {
    title: "Consistency",
    detail: "Clear checklists, consistent quality, and dependable scheduling.",
    icon: "sparkle",
  },
  {
    title: "Trust",
    detail: "A friendly crew that shows up prepared and on time.",
    icon: "users",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About us"
        title="Cleaning that feels personal, every single visit."
        subtitle="Clean to the Macks is a residential cleaning team focused on consistent results, clear communication, and a welcoming experience for every household."
        primaryCta={{ href: "/book", label: "Book a Cleaning" }}
        secondaryCta={{ href: "/our-work", label: "See Our Work" }}
        media={
          <div className="grid" style={{ gap: 12 }}>
            <div className="media" style={{ minHeight: 220 }}>
              <Image
                src="/about-1.jpg"
                alt="Bright living room"
                fill
                sizes="(max-width: 1024px) 100vw, 480px"
                style={{ objectFit: "cover" }}
              />
            </div>
            <div className="media" style={{ minHeight: 200 }}>
              <Image
                src="/about-2.jpg"
                alt="Spotless kitchen counter"
                fill
                sizes="(max-width: 1024px) 100vw, 480px"
                style={{ objectFit: "cover" }}
              />
            </div>
          </div>
        }
      >
        <div style={{ marginTop: 8 }}>
          <StatStrip
            items={[
              { value: "7 days", label: "Flexible scheduling" },
              { value: "100%", label: "Satisfaction focus" },
              { value: "Local", label: "Community driven" },
            ]}
          />
        </div>
      </PageHero>

      <SectionBand
        title="Our promise"
        subtitle="A consistent experience from booking through walk-through."
      >
        <div className="grid grid-3">
          {promises.map((p) => (
            <FeatureCard key={p.title} icon={p.icon} title={p.title} body={p.detail} />
          ))}
        </div>
      </SectionBand>

      <SectionBand
        band={false}
        title="What we value"
        subtitle="The standards that guide every clean."
      >
        <div className="grid grid-3">
          {values.map((v) => (
            <FeatureCard key={v.title} icon={v.icon} title={v.title} body={v.detail} />
          ))}
        </div>
      </SectionBand>

      <CtaBanner
        title="Bring our team to your home."
        subtitle="Pick a service, choose a time, and we'll take care of the rest."
        primaryCta={{ href: "/book", label: "Book Now" }}
      />
    </>
  );
}
