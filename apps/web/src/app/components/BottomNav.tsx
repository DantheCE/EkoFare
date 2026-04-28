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

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 h-[56px] bg-[var(--white)] border-t border-[var(--grey-100)] lg:hidden z-50 flex items-center justify-around px-2"
      style={{ boxShadow: "var(--shadow-nav)" }}
    >
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center justify-center flex-1 h-full transition-colors"
            aria-current={isActive ? "page" : undefined}
          >
            <Icon
              size={24}
              strokeWidth={isActive ? 2.5 : 2}
              style={{ 
                color: isActive ? "var(--green-800)" : "var(--grey-500)" 
              }}
            />
            <span
              style={{
                fontSize: "10px",
                fontFamily: "DM Sans, sans-serif",
                fontWeight: isActive ? 600 : 500,
                color: isActive ? "var(--green-800)" : "var(--grey-500)",
                marginTop: "2px",
              }}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
