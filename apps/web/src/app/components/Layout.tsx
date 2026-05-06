"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Toaster } from "sonner";
import DesktopSidebar from "./DesktopSidebar";
import BottomNav from "./BottomNav";

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.shiftKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        router.push("/dev");
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  return (
    <div className="min-h-full flex flex-col">
      <DesktopSidebar />
      
      <main className="flex-1 lg:pl-64 pb-[56px] lg:pb-0">
        {children}
      </main>

      <BottomNav />
      
      <Toaster 
        position="top-center" 
        toastOptions={{
          style: {
            fontFamily: 'DM Sans, sans-serif',
            borderRadius: '10px',
          }
        }}
      />
    </div>
  );
}
