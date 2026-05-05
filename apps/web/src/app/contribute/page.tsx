import type { Metadata } from "next";
import Contribute from "../pages/Contribute";

export const metadata: Metadata = {
  title: "Add a Route — EkoFare",
  description:
    "Contribute a Lagos transit fare route. Help fellow commuters know what to expect before they board.",
};

export default function ContributePage() {
  return <Contribute />;
}
