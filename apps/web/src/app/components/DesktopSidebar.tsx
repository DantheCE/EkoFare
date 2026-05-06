"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bus, Search, BookmarkCheck, PlusCircle } from "lucide-react";

const NAV_ITEMS = [
  { label: "Routes", href: "/", icon: Bus },
  { label: "Search", href: "/routes", icon: Search },
  { label: "Saved", href: "/saved", icon: BookmarkCheck },
  { label: "Contribute", href: "/contribute", icon: PlusCircle },
];

export default function DesktopSidebar() {
  const pathname = usePathname();

  return (
    <aside 
      className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-64 bg-[var(--white)] border-r border-[var(--grey-100)] z-50 p-6"
    >
      {/* Logo Row */}
      <div className="flex items-center gap-3 mb-10">
        <div 
          className="w-10 h-10 bg-[var(--green-800)] flex items-center justify-center rounded-[10px]"
        >
          <Bus size={24} color="white" />
        </div>
        <span 
          style={{ 
            fontFamily: "Syne, sans-serif", 
            fontWeight: 700, 
            fontSize: "22px",
            color: "var(--grey-900)"
          }}
        >
          EkoFare
        </span>
      </div>

      {/* Nav Pills */}
      <nav className="flex flex-col gap-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-[10px] transition-colors"
              style={{
                backgroundColor: isActive ? "var(--green-100)" : "transparent",
                color: isActive ? "var(--green-800)" : "var(--grey-700)",
              }}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon 
                size={20} 
                strokeWidth={isActive ? 2.5 : 2}
                style={{
                  color: isActive ? "var(--green-800)" : "var(--grey-500)"
                }}
              />
              <span
                style={{
                  fontFamily: "DM Sans, sans-serif",
                  fontWeight: isActive ? 600 : 500,
                  fontSize: "16px",
                }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Card */}
      <div className="mt-auto p-4 rounded-[14px] bg-[var(--cream)] flex flex-col gap-3">
        <p 
          style={{ 
            fontFamily: "DM Sans, sans-serif", 
            fontWeight: 500, 
            fontSize: "14px",
            color: "var(--grey-700)",
            lineHeight: "1.4"
          }}
        >
          Help fellow commuters by adding new fares you encounter.
        </p>
        <Link
          href="/contribute"
          className="flex items-center justify-center py-2.5 rounded-[10px] transition-opacity hover:opacity-90"
          style={{
            backgroundColor: "var(--terra-700)",
            color: "var(--white)",
            fontFamily: "DM Sans, sans-serif",
            fontWeight: 600,
            fontSize: "14px",
          }}
        >
          Contribute
        </Link>
      </div>

      {/* Dev Link */}
      <Link 
        href="/dev" 
        className="mt-4 flex items-center justify-center py-2 transition-opacity hover:opacity-80"
        style={{
          color: "var(--grey-400)",
          fontFamily: "DM Sans, sans-serif",
          fontSize: "12px",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
        title="Component Lab (Shift+D)"
      >
        ••• Dev Lab
      </Link>
    </aside>
  );
}
