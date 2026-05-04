import { Metadata } from "next";
import Saved from "../pages/Saved";

export const metadata: Metadata = {
  title: "Saved Routes - EkoFare",
  description: "View your saved transport routes in Lagos.",
};

export default function SavedPage() {
  return <Saved />;
}
