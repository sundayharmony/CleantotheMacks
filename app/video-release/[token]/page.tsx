import { prisma } from "@/lib/db";
import SignVideoReleaseForm from "./SignVideoReleaseForm";

export const dynamic = "force-dynamic";

export default async function VideoReleasePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const release = await prisma.videoRelease.findUnique({
    where: { token },
    select: {
      clientName: true,
      propertyAddress: true,
      status: true,
      tokenExpiresAt: true,
    },
  });

  if (!release) {
    return (
      <section className="section">
        <div className="container">
          <h1 style={{ fontSize: 34, marginBottom: 8 }}>Video Release Form</h1>
          <p style={{ color: "tomato" }}>This release form link is invalid.</p>
        </div>
      </section>
    );
  }

  // Server-rendered expiry check for initial page state.
  // eslint-disable-next-line react-hooks/purity
  const expired = release.tokenExpiresAt.getTime() < Date.now();
  const alreadySigned = release.status === "SIGNED";

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 760 }}>
        <SignVideoReleaseForm
          token={token}
          clientName={release.clientName}
          propertyAddress={release.propertyAddress}
          alreadySigned={alreadySigned}
          expired={expired}
        />
      </div>
    </section>
  );
}
