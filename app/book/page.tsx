"use client";

import { useState } from "react";

export default function BookPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const payload = {
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      address: formData.get("address"),
      homeSize: formData.get("homeSize"),
      sqft: formData.get("sqft"),
      notes: formData.get("notes"),
    };

    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      setSuccess(true);
      form.reset();
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="section">
      <div className="container">
        <div className="hero" style={{ alignItems: "start" }}>
          <div className="stack">
            <span className="hero-badge">Booking</span>
            <h1 style={{ fontSize: 44, marginBottom: 10 }}>Book a Cleaning</h1>
            <p className="section-subtitle">
              Share a few details and we’ll confirm a time that works for you.
            </p>
            <div className="card">
              <h3 style={{ marginBottom: 10 }}>What happens next</h3>
              <ol style={{ display: "grid", gap: 10, color: "var(--color-muted)" }}>
                <li>We review your request.</li>
                <li>We confirm your preferred schedule.</li>
                <li>We arrive ready with a checklist tailored to your home.</li>
              </ol>
            </div>
          </div>

          <div>
            {success && (
              <p style={{ color: "limegreen", marginBottom: 12 }}>
                Booking submitted successfully!
              </p>
            )}

            {error && (
              <p style={{ color: "tomato", marginBottom: 12 }}>
                {error}
              </p>
            )}

            <form
              onSubmit={onSubmit}
              className="card"
              style={{ display: "grid", gap: 16 }}
            >
              <div className="grid grid-2">
                <label>
                  Name *
                  <input className="input" name="name" required placeholder="Your name" />
                </label>

                <label>
                  Email *
                  <input
                    className="input"
                    type="email"
                    name="email"
                    required
                    placeholder="you@email.com"
                  />
                </label>
              </div>

              <div className="grid grid-2">
                <label>
                  Phone *
                  <input
                    className="input"
                    name="phone"
                    required
                    placeholder="555-123-4567"
                  />
                </label>

                <label>
                  Address *
                  <input
                    className="input"
                    name="address"
                    required
                    placeholder="Street address"
                  />
                </label>
              </div>

              <div className="grid grid-2">
                <label>
                  Bedrooms *
                  <select className="input" name="homeSize" required>
                    <option value="">Select one…</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5+">5+</option>
                  </select>
                </label>

                <label>
                  Square Feet *
                  <input
                    className="input"
                    name="sqft"
                    required
                    placeholder="e.g. 1800"
                  />
                </label>
              </div>

              <label>
                Notes (optional)
                <textarea
                  className="input"
                  name="notes"
                  placeholder="Pets, special areas, timing, etc."
                />
              </label>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ width: "fit-content" }}
              >
                {loading ? "Submitting..." : "Submit Booking"}
              </button>
              <small>* Required fields</small>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
