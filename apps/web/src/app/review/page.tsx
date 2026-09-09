import { Metadata } from 'next';
import ReviewClient from './ReviewClient';

export const metadata: Metadata = {
  title: 'Review Queue | EkoFare',
  description: 'Community review queue for unverified routes.',
};

export default function ReviewPage() {
  return <ReviewClient />;
}
