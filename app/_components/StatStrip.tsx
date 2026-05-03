export default function StatStrip({
  items,
}: {
  items: { value: string; label: string }[];
}) {
  return (
    <div className="stat-strip">
      {items.map((item) => (
        <div key={item.label} className="stat">
          <strong>{item.value}</strong>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
