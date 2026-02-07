import { prisma } from "@/lib/db";

export default async function AdminPage() {
  const bookings = await prisma.booking.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <main>
      <h1>Admin</h1>
      {bookings.length === 0 ? (
        <p>No bookings yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Created</th>
              <th>Name</th>
              <th>Email</th>
              <th>Home Size</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr key={booking.id}>
                <td>{booking.createdAt.toISOString()}</td>
                <td>{booking.name}</td>
                <td>{booking.email}</td>
                <td>{booking.homeSize}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
