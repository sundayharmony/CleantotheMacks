import type { ReactNode } from "react";

type Variant = "info" | "success" | "error" | "warning";

const ICON_PATHS: Record<Variant, ReactNode> = {
  info: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-5M12 8h.01" strokeLinecap="round" />
    </>
  ),
  success: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="m8 12 3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  error: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
    </>
  ),
  warning: (
    <>
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <path d="M12 9v4M12 17h.01" strokeLinecap="round" />
    </>
  ),
};

export default function Alert({
  variant = "info",
  title,
  children,
  live,
}: {
  variant?: Variant;
  title?: string;
  children?: ReactNode;
  live?: boolean;
}) {
  return (
    <div
      className={`alert alert-${variant}`}
      role={variant === "error" || variant === "warning" ? "alert" : "status"}
      aria-live={live ? "polite" : undefined}
    >
      <svg
        className="alert-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        {ICON_PATHS[variant]}
      </svg>
      <div>
        {title ? <strong>{title}</strong> : null}
        {title && children ? " " : null}
        {children}
      </div>
    </div>
  );
}
