"use client";

import Image from "next/image";
import { useState } from "react";

export default function BeforeAfter({
  beforeUrl,
  afterUrl,
  title,
  height = 260,
}: {
  beforeUrl: string;
  afterUrl: string;
  title: string;
  height?: number;
}) {
  const [showAfter, setShowAfter] = useState(false);
  const isExternal =
    beforeUrl.startsWith("http://") || beforeUrl.startsWith("https://");

  function toggle() {
    setShowAfter((v) => !v);
  }

  return (
    <div
      className={`before-after${showAfter ? " show-after" : ""}`}
      style={{ height }}
      onClick={toggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggle();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`${title} before and after, tap to toggle`}
      aria-pressed={showAfter}
    >
      <span className="ba-tag">Before</span>
      <span className="ba-tag after-tag" style={{ left: "auto", right: 10 }}>
        After
      </span>
      {isExternal ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="ba-img" src={beforeUrl} alt={`${title} before`} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="ba-img after"
            src={afterUrl}
            alt={`${title} after`}
          />
        </>
      ) : (
        <>
          <Image
            src={beforeUrl}
            alt={`${title} before`}
            fill
            sizes="(max-width: 900px) 100vw, 50vw"
            style={{ objectFit: "cover" }}
          />
          <Image
            src={afterUrl}
            alt={`${title} after`}
            fill
            sizes="(max-width: 900px) 100vw, 50vw"
            className="after"
            style={{ objectFit: "cover" }}
          />
        </>
      )}
      <button
        type="button"
        className="ba-toggle"
        onClick={(e) => {
          e.stopPropagation();
          toggle();
        }}
      >
        {showAfter ? "Show before" : "Show after"}
      </button>
    </div>
  );
}
