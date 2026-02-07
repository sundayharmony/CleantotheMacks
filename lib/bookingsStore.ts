// Deprecated: replaced by Prisma/SQLite. Do not use.
export type Booking = {
  name: string;
  email: string;
  address: string;
  homeSize: string;
  notes: string;
  createdAt: string;
};

const bookings: Booking[] = [];

export function addBooking(booking: Omit<Booking, "createdAt">) {
  bookings.push({ ...booking, createdAt: new Date().toISOString() });
}

export function getBookings() {
  return bookings;
}
