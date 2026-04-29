import type { Metadata } from "next";
import "../styles/index.css"; // Your new style pipeline

export const metadata: Metadata = {
  title: "EkoFare — Lagos Transit Fares",
  description: "Check Danfo, BRT, and Keke fares across Lagos.",
};

import Layout from "./components/Layout";
import QueryProvider from "./components/QueryProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      {/* 
          Apply the --bg-page variable from your theme.css 
          to ensure the background is always Cream.
      */}
      <body className="min-h-full flex flex-col bg-[var(--bg-page)] text-[var(--text-primary)]">
        <QueryProvider>
          <Layout>
            {children}
          </Layout>
        </QueryProvider>
      </body>
    </html>
  );
}
