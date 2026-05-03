import Image from "next/image";
import { prisma } from "@/lib/db";
import PageHero from "./_components/PageHero";
import StatStrip from "./_components/StatStrip";
import SectionBand from "./_components/SectionBand";
import FeatureCard from "./_components/FeatureCard";
import TestimonialCard from "./_components/TestimonialCard";
import CtaBanner from "./_components/CtaBanner";

export const dynamic = "force-dynamic";

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
    const result = await prisma.$queryRaw<{ exists: boolean }[]>`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'Testimonial'
      ) as exists
    `;
    if (!result[0]?.exists) return fallbackTestimonials;

    const testimonials = await prisma.testimonial.findMany({
      where: { visible: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, quote: true, rating: true },
    });
    return testimonials.length > 0 ? testimonials : fallbackTestimonials;
  } catch {
    return fallbackTestimonials;
  }
}

const services: { title: string; detail: string; icon: "broom" | "sparkle" | "plus" | "paint" }[] = [
  {
    title: "Standard Cleaning",
    detail: "Recurring or one-time visits for kitchens, baths, bedrooms, and living areas.",
    icon: "broom",
  },
  {
    title: "Deep Cleaning",
    detail: "Detailed, top-to-bottom reset for move-ins, move-outs, or seasonal refresh.",
    icon: "sparkle",
  },
  {
    title: "Add-on Focus",
    detail: "Appliance interiors, inside cabinets, baseboards, and more on request.",
    icon: "plus",
  },
  {
    title: "Interior Painting",
    detail: "Refresh rooms with clean, professional painting for walls, trim, and touch-ups.",
    icon: "paint",
  },
];

const stats = [
  { value: "500+", label: "Homes refreshed" },
  { value: "4.9★", label: "Average rating" },
  { value: "48 hr", label: "Flexible booking" },
];

export default async function Home() {
  const testimonials = await getTestimonials();

  return (
    <>
      <PageHero
        eyebrow="Trusted home cleaning"
        title="Cleaning and painting services, done right every time."
        subtitle="Book reliable residential cleaning and interior painting with a friendly crew, clear communication, and professional results."
        primaryCta={{ href: "/book", label: "Book a Cleaning" }}
        secondaryCta={{ href: "/our-work", label: "View Our Work" }}
        media={
          <div className="media media-tall">
            <Image
              src="/hero.jpg"
              alt="Bright, freshly cleaned living room"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 540px"
              style={{ objectFit: "cover" }}
            />
          </div>
        }
      >
        <div style={{ marginTop: 8 }}>
          <StatStrip items={stats} />
        </div>
      </PageHero>

      <SectionBand
        title="Services to fit every home"
        subtitle="Choose a plan that fits your space. We tailor every visit to the rooms that matter most."
      >
        <div className="grid grid-auto-260">
          {services.map((service) => (
            <FeatureCard
              key={service.title}
              icon={service.icon}
              title={service.title}
              body={service.detail}
            />
          ))}
        </div>
      </SectionBand>

      <SectionBand
        band={false}
        title="Loved by homeowners"
        subtitle="Real reviews from neighbors who trust us with their home."
      >
        <div className="grid grid-auto-260">
          {testimonials.map((item) => (
            <TestimonialCard
              key={item.id}
              name={item.name}
              quote={item.quote}
              rating={item.rating}
            />
          ))}
        </div>
      </SectionBand>

      <CtaBanner
        title="Ready for a fresh start?"
        subtitle="Tell us about your home and we'll take care of the rest."
        primaryCta={{ href: "/book", label: "Book Now" }}
        secondaryCta={{ href: "/service-area", label: "Check Service Area" }}
      />
    </>
  );
}
