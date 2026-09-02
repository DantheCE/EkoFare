import { Metadata } from 'next';
import ReviewClient from './ReviewClient';

export const metadata: Metadata = {
  title: 'Review Queue | EkoFare',
  description: 'Community review queue for unverified routes.',
};

export default function ReviewPage() {
  return (
    <main className="max-w-2xl mx-auto min-h-[100dvh] pt-[48px] px-[32px] pb-[100px]">
      <ReviewClient />
    </main>
  );
}
