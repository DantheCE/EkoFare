import { Metadata } from 'next';
import ReviewClient from './ReviewClient';

export const metadata: Metadata = {
  title: 'Review Queue | EkoFare',
  description: 'Community review queue for unverified routes.',
};

export default function ReviewPage() {
  return (
    <main className="min-h-screen bg-black text-white p-4 pt-8 md:p-8 max-w-2xl mx-auto pb-24">
      <header className="mb-8">
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-yellow-400">
          Review Queue
        </h1>
        <p className="mt-2 text-zinc-400 uppercase tracking-widest text-sm font-bold">
          Verify community submissions
        </p>
      </header>

      <ReviewClient />
    </main>
  );
}
