import type { ReactNode } from "react";

export type FeatureIcon =
  | "broom"
  | "sparkle"
  | "home"
  | "calendar"
  | "shield"
  | "heart"
  | "star"
  | "paint"
  | "kitchen"
  | "bath"
  | "plus"
  | "pin"
  | "clock"
  | "users";

function Icon({ name }: { name: FeatureIcon }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    width: 22,
    height: 22,
    "aria-hidden": true,
  };
  switch (name) {
    case "broom":
      return (
        <svg {...common}>
          <path d="M19 5 14 10" />
          <path d="m9 15-7 7" />
          <path d="M14 10c4-4 6-6 8-4l-8 8" />
          <path d="M9 15c-4 4-2 7 1 7s5-1 6-3" />
        </svg>
      );
    case "sparkle":
      return (
        <svg {...common}>
          <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" />
        </svg>
      );
    case "home":
      return (
        <svg {...common}>
          <path d="M3 12 12 4l9 8" />
          <path d="M5 10v10h14V10" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="17" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      );
    case "shield":
      return (
        <svg {...common}>
          <path d="M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    case "heart":
      return (
        <svg {...common}>
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      );
    case "star":
      return (
        <svg {...common}>
          <path d="M12 2 15 9l7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" />
        </svg>
      );
    case "paint":
      return (
        <svg {...common}>
          <path d="M19 11h2a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1l-3 4h-3v-2a3 3 0 0 1 3-3v-2a2 2 0 0 0-2-2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2z" />
        </svg>
      );
    case "kitchen":
      return (
        <svg {...common}>
          <rect x="4" y="2" width="16" height="20" rx="2" />
          <path d="M4 10h16M9 6h.01M9 14h.01" />
        </svg>
      );
    case "bath":
      return (
        <svg {...common}>
          <path d="M2 12h20l-1.5 6a3 3 0 0 1-3 2H6.5a3 3 0 0 1-3-2L2 12z" />
          <path d="M5 12V5a2 2 0 0 1 2-2h2" />
          <path d="M9 7h2" />
        </svg>
      );
    case "plus":
      return (
        <svg {...common}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case "pin":
      return (
        <svg {...common}>
          <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      );
    case "clock":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      );
    case "users":
      return (
        <svg {...common}>
          <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
          <circle cx="10" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
  }
}

export default function FeatureCard({
  icon,
  title,
  body,
  link,
  children,
}: {
  icon?: FeatureIcon;
  title: string;
  body?: string;
  link?: { href: string; label: string };
  children?: ReactNode;
}) {
  return (
    <div className="feature-card">
      {icon ? (
        <div className="icon">
          <Icon name={icon} />
        </div>
      ) : null}
      <h3>{title}</h3>
      {body ? <p>{body}</p> : null}
      {children}
      {link ? <a href={link.href}>{link.label} →</a> : null}
    </div>
  );
}
