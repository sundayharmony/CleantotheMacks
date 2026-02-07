import { prisma } from "@/lib/prisma";

type BookingInput = {
  name: unknown;
  email: unknown;
  phone: unknown;
  address: unknown;
  homeType: unknown;
  bedrooms: unknown;
  bathrooms: unknown;
  pets: unknown;
  preferredDate: unknown;
  notes?: unknown;
};

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isBoolean = (value: unknown): value is boolean =>
  typeof value === "boolean";

const badRequest = (error: string) =>
  Response.json({ ok: false, error }, { status: 400 });

export async function POST(request: Request) {
  let body: BookingInput;

  try {
    body = (await request.json()) as BookingInput;
  } catch {
    return badRequest("Invalid JSON body.");
  }

  if (!isNonEmptyString(body.name)) {
    return badRequest("Name is required.");
  }
  if (!isNonEmptyString(body.email)) {
    return badRequest("Email is required.");
  }
  if (!isNonEmptyString(body.phone)) {
    return badRequest("Phone is required.");
  }
  if (!isNonEmptyString(body.address)) {
    return badRequest("Address is required.");
  }
  if (!isNonEmptyString(body.homeType)) {
    return badRequest("Home type is required.");
  }
  if (!isNumber(body.bedrooms)) {
    return badRequest("Bedrooms must be a number.");
  }
  if (!isNumber(body.bathrooms)) {
    return badRequest("Bathrooms must be a number.");
  }
  if (!isBoolean(body.pets)) {
    return badRequest("Pets must be a boolean.");
  }
  if (!isNonEmptyString(body.preferredDate)) {
    return badRequest("Preferred date is required.");
  }
  if (body.notes !== undefined && !isNonEmptyString(body.notes)) {
    return badRequest("Notes must be a non-empty string when provided.");
  }

  const booking = await prisma.booking.create({
    data: {
      name: body.name,
      email: body.email,
      phone: body.phone,
      address: body.address,
      homeType: body.homeType,
      bedrooms: body.bedrooms,
      bathrooms: body.bathrooms,
      pets: body.pets,
      preferredDate: body.preferredDate,
      notes: body.notes ?? null,
    },
    select: {
      id: true,
    },
  });

  return Response.json({ ok: true, id: booking.id }, { status: 201 });
}
