export default function TestimonialCard({
  name,
  quote,
  rating,
}: {
  name: string;
  quote: string;
  rating?: number | null;
}) {
  return (
    <div className="testimonial-card">
      {rating ? (
        <div className="stars" aria-label={`${rating} out of 5 stars`}>
          {"\u2605".repeat(rating)}
          {"\u2606".repeat(5 - rating)}
        </div>
      ) : null}
      <blockquote>&ldquo;{quote}&rdquo;</blockquote>
      <cite>{name}</cite>
    </div>
  );
}
