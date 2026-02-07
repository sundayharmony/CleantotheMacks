"use client";

import { useState } from "react";

export default function BookPage() {
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    const response = await fetch("/api/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      setSubmitted(true);
      form.reset();
    }
  }

  if (submitted) {
    return <main>Submitted</main>;
  }

  return (
    <main>
      <h1>Book</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name">Name</label>
          <input id="name" name="name" type="text" />
        </div>
        <div>
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" />
        </div>
        <div>
          <label htmlFor="address">Address</label>
          <input id="address" name="address" type="text" />
        </div>
        <div>
          <label htmlFor="homeSize">Home Size</label>
          <input id="homeSize" name="homeSize" type="text" />
        </div>
        <div>
          <label htmlFor="notes">Notes</label>
          <textarea id="notes" name="notes" />
        </div>
        <button type="submit">Submit</button>
      </form>
    </main>
  );
}
