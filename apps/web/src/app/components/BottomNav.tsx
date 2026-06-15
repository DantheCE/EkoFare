'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bus, Search, Bookmark, Plus } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// BottomNav (Spec §6.6). 4 tabs: Routes, Search, Saved, Add. Active = yellow
// icon tile + yellow label; inactive = ink-4 tile + faint label. ink-2 bar,
// top border, safe-area bottom padding. ≥44px targets.
// ─────────────────────────────────────────────────────────────────────────────

const TABS = [
  { label: 'Routes', href: '/', icon: Bus, match: (p: string) => p === '/' || p.startsWith('/routes') },
  { label: 'Search', href: '/search', icon: Search, match: (p: string) => p.startsWith('/search') },
  { label: 'Saved', href: '/saved', icon: Bookmark, match: (p: string) => p.startsWith('/saved') },
  { label: 'Add', href: '/contribute', icon: Plus, match: (p: string) => p.startsWith('/contribute') },
];

export default function BottomNav() {
  const pathname = usePathname() ?? '/';

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-ink-2"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around">
        {TABS.map((tab) => {
          const active = tab.match(pathname);
          const Icon = tab.icon;
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                className="flex min-h-[56px] flex-col items-center justify-center gap-1 py-2"
              >
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-input transition-colors"
                  style={{
                    background: active ? 'var(--yellow)' : 'var(--ink-4)',
                    color: active ? 'var(--ink)' : 'var(--faint)',
                    borderRadius: 'var(--radius-input)',
                  }}
                >
                  <Icon size={18} strokeWidth={2.2} />
                </span>
                <span
                  className="text-[11px] font-semibold"
                  style={{ color: active ? 'var(--yellow)' : 'var(--faint)' }}
                >
                  {tab.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
