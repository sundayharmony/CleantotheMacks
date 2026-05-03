"use client";

import { useEffect, useRef, useState } from "react";
import PageHero from "../_components/PageHero";
import SectionBand from "../_components/SectionBand";
import FeatureCard from "../_components/FeatureCard";
import CtaBanner from "../_components/CtaBanner";

const SERVICE_AREAS = [
  {
    name: "South Jersey Counties",
    icon: "pin" as const,
    areas: [
      "Atlantic County",
      "Camden County",
      "Burlington County",
      "Gloucester County",
      "Cape May County",
      "Cumberland County",
      "Salem County",
      "Cherry Hill",
      "Voorhees",
      "Marlton",
    ],
  },
  {
    name: "Philadelphia Metro",
    icon: "pin" as const,
    areas: [
      "Center City",
      "University City",
      "South Philly",
      "Northern Liberties",
      "Fishtown",
      "Manayunk",
      "Germantown",
      "Chestnut Hill",
      "Mount Airy",
      "Roxborough",
    ],
  },
  {
    name: "Central Jersey",
    icon: "pin" as const,
    areas: [
      "Princeton",
      "Trenton",
      "Hamilton",
      "Lawrence",
      "Ewing",
      "Robbinsville",
      "East Windsor",
      "West Windsor",
    ],
  },
];

const MAP_CENTER: [number, number] = [39.88, -75.05];
const MAP_ZOOM = 10;

const NJ_POLYGON: [number, number][] = [
  [39.72, -74.85],
  [39.72, -75.05],
  [39.85, -75.10],
  [39.95, -75.05],
  [40.05, -74.85],
  [40.05, -74.65],
  [39.95, -74.55],
  [39.85, -74.55],
];

const PHILLY_POLYGON: [number, number][] = [
  [39.87, -75.10],
  [39.87, -75.25],
  [39.95, -75.30],
  [40.05, -75.28],
  [40.10, -75.15],
  [40.05, -75.10],
  [39.95, -75.08],
];

const SOUTH_JERSEY_CORE_POLYGON: [number, number][] = [
  [39.18, -75.34],
  [39.16, -75.05],
  [39.15, -74.88],
  [39.17, -74.73],
  [39.19, -74.58],
  [39.24, -74.46],
  [39.33, -74.39],
  [39.48, -74.36],
  [39.64, -74.38],
  [39.77, -74.45],
  [39.89, -74.58],
  [39.94, -74.76],
  [39.92, -74.98],
  [39.86, -75.14],
  [39.70, -75.22],
  [39.54, -75.26],
  [39.38, -75.30],
  [39.26, -75.33],
];

export default function ServiceAreaPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapRef.current || mapLoaded) return;

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const L = (window as any).L;
      if (!L || !mapRef.current) return;

      const map = L.map(mapRef.current).setView(MAP_CENTER, MAP_ZOOM);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);

      L.polygon(NJ_POLYGON, {
        color: "#3b82f6",
        fillColor: "#3b82f6",
        fillOpacity: 0.08,
        weight: 2,
      })
        .addTo(map)
        .bindPopup("<strong>South &amp; Central Jersey</strong><br/>Full service coverage");

      L.polygon(SOUTH_JERSEY_CORE_POLYGON, {
        color: "#2563eb",
        fillColor: "#2563eb",
        fillOpacity: 0.24,
        weight: 3,
      })
        .addTo(map)
        .bindPopup("<strong>South Jersey Core</strong><br/>Atlantic County and surrounding counties");

      L.polygon(PHILLY_POLYGON, {
        color: "#8b5cf6",
        fillColor: "#8b5cf6",
        fillOpacity: 0.15,
        weight: 2,
      })
        .addTo(map)
        .bindPopup("<strong>Philadelphia Metro</strong><br/>Full service coverage");

      const markerOpts = { radius: 6, fillOpacity: 0.85, weight: 1, color: "#fff" };

      L.circleMarker([39.93, -75.17], { ...markerOpts, fillColor: "#8b5cf6" })
        .addTo(map)
        .bindPopup("Center City, Philadelphia");
      L.circleMarker([39.93, -74.95], { ...markerOpts, fillColor: "#3b82f6" })
        .addTo(map)
        .bindPopup("Cherry Hill, NJ");
      L.circleMarker([39.36, -74.43], { ...markerOpts, fillColor: "#2563eb", radius: 7 })
        .addTo(map)
        .bindPopup("Atlantic County, NJ");
      L.circleMarker([39.98, -74.82], { ...markerOpts, fillColor: "#3b82f6" })
        .addTo(map)
        .bindPopup("Mount Laurel, NJ");
      L.circleMarker([40.05, -74.97], { ...markerOpts, fillColor: "#3b82f6" })
        .addTo(map)
        .bindPopup("Moorestown, NJ");
      L.circleMarker([40.35, -74.66], { ...markerOpts, fillColor: "#3b82f6" })
        .addTo(map)
        .bindPopup("Princeton, NJ");

      setMapLoaded(true);
    };
    document.head.appendChild(script);
  }, [mapLoaded]);

  return (
    <>
      <PageHero
        eyebrow="Service area"
        title="Serving South Jersey, Atlantic County and the Philly metro."
        subtitle="We proudly serve homes across South Jersey (including Atlantic County and surrounding counties), Central Jersey, and the Philadelphia metro area."
        primaryCta={{ href: "/book", label: "Book a Cleaning" }}
      >
        <p className="text-muted" style={{ fontSize: 15 }}>
          Core South Jersey coverage includes Atlantic, Camden, Burlington,
          Gloucester, Cape May, Cumberland, and Salem counties.
        </p>
      </PageHero>

      <section className="section section-tight">
        <div className="container">
          <div
            ref={mapRef}
            className="map-shell"
            role="img"
            aria-label="Interactive map of service coverage across South Jersey, Central Jersey, and Philadelphia metro"
          />
          <div className="map-legend" aria-hidden="true">
            <div className="legend-item bold">
              <span className="swatch swatch-core" />
              South Jersey Core
            </div>
            <div className="legend-item">
              <span className="swatch swatch-nj" />
              Greater New Jersey
            </div>
            <div className="legend-item">
              <span className="swatch swatch-philly" />
              Philadelphia Metro
            </div>
          </div>
        </div>
      </section>

      <SectionBand
        title="Areas we cover"
        subtitle="Don't see your town? Reach out — we may still be able to help."
      >
        <div className="grid grid-3">
          {SERVICE_AREAS.map((region) => (
            <FeatureCard key={region.name} icon={region.icon} title={region.name}>
              <ul className="area-list">
                {region.areas.map((area) => (
                  <li key={area}>{area}</li>
                ))}
              </ul>
            </FeatureCard>
          ))}
        </div>
      </SectionBand>

      <CtaBanner
        title="Not sure if we cover your area?"
        subtitle="Reach out and we'll let you know!"
        primaryCta={{ href: "/book", label: "Book a Cleaning" }}
      />
    </>
  );
}
