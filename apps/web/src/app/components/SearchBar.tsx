'use client';

import Link from 'next/link';
import { Search } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// SearchBar (Spec §3.1). On Home this is a dark ink-3 affordance that routes to
// /search on tap (not a live input). On /search it becomes a real input — that
// variant lands in the next pass.
// ─────────────────────────────────────────────────────────────────────────────

export default function SearchBar({
  href = '/search',
  placeholder = 'Search stops or routes…',
}: {
  href?: string;
  placeholder?: string;
}) {
  return (
    <Link
      href={href}
      className="flex h-12 items-center gap-3 rounded-input border border-line bg-ink-3 px-4 text-muted transition-colors hover:bg-ink-4"
      style={{ borderRadius: 'var(--radius-input)' }}
      aria-label="Search stops or routes"
    >
      <Search size={18} aria-hidden />
      <span className="text-[15px]">{placeholder}</span>
    </Link>
  );
}
