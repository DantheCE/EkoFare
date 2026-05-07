import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pending Contributions — EkoFare",
  description: "Review and verify community-submitted transit fare routes.",
};

import PendingContributions from "../../pages/PendingContributions";

export default function PendingPage() {
  return <PendingContributions />;
}
