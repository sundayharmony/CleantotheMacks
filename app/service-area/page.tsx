"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

// Service area data
const SERVICE_AREAS = [
  {
    name: "South Jersey Counties",
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
    areas: ["Center City", "University City", "South Philly", "Northern Liberties", "Fishtown", "Manayunk", "Germantown", "Chestnut Hill", "Mount Airy", "Roxborough"],
  },
  {
    name: "Central Jersey",
    areas: ["Princeton", "Trenton", "Hamilton", "Lawrence", "Ewing", "Robbinsville", "East Windsor", "West Windsor"],
  },
];

// Map center: roughly between NJ and Philly
const MAP_CENTER: [number, number] = [39.88, -75.05];
const MAP_ZOOM = 10;

// Service area polygons (approximate)
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
  [39.30, -75.10],
  [39.30, -74.65],
  [39.55, -74.45],
  [39.78, -74.52],
  [39.92, -74.70],
  [39.90, -74.98],
  [39.70, -75.14],
  [39.48, -75.20],
];

export default function ServiceAreaPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapRef.current || mapLoaded) return;

    // Dynamically load Leaflet
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

      // South Jersey polygon
      L.polygon(NJ_POLYGON, {
        color: "#3b82f6",
        fillColor: "#3b82f6",
        fillOpacity: 0.08,
        weight: 2,
      })
        .addTo(map)
        .bindPopup("<strong>South &amp; Central Jersey</strong><br/>Full service coverage");

      // South Jersey core highlight
      L.polygon(SOUTH_JERSEY_CORE_POLYGON, {
        color: "#2563eb",
        fillColor: "#2563eb",
        fillOpacity: 0.24,
        weight: 3,
      })
        .addTo(map)
        .bindPopup("<strong>South Jersey Core</strong><br/>Atlantic County and surrounding counties");

      // Philly polygon
      L.polygon(PHILLY_POLYGON, {
        color: "#8b5cf6",
        fillColor: "#8b5cf6",
        fillOpacity: 0.15,
        weight: 2,
      })
        .addTo(map)
        .bindPopup("<strong>Philadelphia Metro</strong><br/>Full service coverage");

      // Markers for key areas
      const markerOpts = { radius: 6, fillOpacity: 0.8, weight: 1, color: "#fff" };

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
      <section className="section">
        <div className="container">
          <h1 style={{ fontSize: 40, marginBottom: 12 }}>
            Service Area - South Jersey, Atlantic County and Nearby
          </h1>
          <p className="section-subtitle">
            We proudly serve homes across South Jersey (including Atlantic County
            and surrounding counties), Central Jersey, and the Philadelphia metro area.
          </p>
          <p style={{ color: "var(--color-muted)" }}>
            Core South Jersey coverage includes Atlantic, Camden, Burlington,
            Gloucester, Cape May, Cumberland, and Salem counties.
          </p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div
            ref={mapRef}
            style={{
              width: "100%",
              height: 450,
              borderRadius: 12,
              border: "1px solid var(--color-border)",
              background: "var(--color-surface)",
              marginBottom: 32,
            }}
          />

          <div style={{ display: "flex", gap: 16, marginBottom: 32, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 14, height: 14, borderRadius: 4, background: "#2563eb", display: "inline-block" }} />
              <span style={{ fontSize: 14, fontWeight: 700 }}>South Jersey Core</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 14, height: 14, borderRadius: 4, background: "#3b82f6", display: "inline-block" }} />
              <span style={{ fontSize: 14 }}>Greater New Jersey Coverage</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 14, height: 14, borderRadius: 4, background: "#8b5cf6", display: "inline-block" }} />
              <span style={{ fontSize: 14 }}>Philadelphia Metro</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section accent-band">
        <div className="container">
          <h2 className="section-title">Areas We Cover</h2>
          <div className="grid grid-3" style={{ marginTop: 24 }}>
            {SERVICE_AREAS.map((region) => (
              <div key={region.name} className="card">
                <h3 style={{ marginBottom: 12, fontSize: 18 }}>{region.name}</h3>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                  {region.areas.map((area) => (
                    <li
                      key={area}
                      style={{ fontSize: 14, color: "var(--color-muted)", paddingLeft: 16, position: "relative" }}
                    >
                      <span style={{ position: "absolute", left: 0 }}>-</span>
                      {area}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ textAlign: "center" }}>
          <h2 style={{ fontSize: 24, marginBottom: 8 }}>
            Not sure if we cover your area?
          </h2>
          <p style={{ color: "var(--color-muted)", marginBottom: 20 }}>
            Reach out and we will let you know!
          </p>
          <Link href="/book" className="btn btn-primary">
            Book a Cleaning
          </Link>
        </div>
      </section>
    </>
  );
}
