import { prisma } from "@/lib/db";
import SignVideoReleaseForm from "./SignVideoReleaseForm";
import Alert from "../../_components/Alert";

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
        <div className="container container-narrow">
          <div className="card card-padded">
            <h1 style={{ fontSize: 26, marginBottom: 16 }}>Video Release Form</h1>
            <Alert variant="error" title="Invalid link.">
              This release form link is invalid or no longer exists. If you
              received this link from us, please contact our office for a new one.
            </Alert>
          </div>
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
      <div className="container container-narrow">
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
