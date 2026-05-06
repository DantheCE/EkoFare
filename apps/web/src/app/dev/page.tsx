import type { Metadata } from "next";
import DevClientPage from "./DevClientPage";

export const metadata: Metadata = {
  title: "EkoFare Component Lab",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DevPage() {
  return <DevClientPage />;
}
