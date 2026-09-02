import { Metadata } from 'next';
import ReviewClient from './ReviewClient';

export const metadata: Metadata = {
  title: 'Review Queue | EkoFare',
  description: 'Community review queue for unverified routes.',
};

export default function ReviewPage() {
  return (
    <main className="px-4 pt-[calc(16px+env(safe-area-inset-top))] pb-24 max-w-2xl mx-auto">
      <header className="mb-8">
        <h1 className="text-[26px] font-extrabold leading-tight text-cream">
          Review <span className="text-yellow">Queue</span>
        </h1>
        <p className="mt-1 text-[14px] text-muted">
          Verify community submissions
        </p>
      </header>

      <ReviewClient />
    </main>
  );
}
