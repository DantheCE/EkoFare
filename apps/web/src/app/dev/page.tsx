import React from 'react';
import { 
  Skeleton, 
  RouteCardSkeleton, 
  StopRowSkeleton, 
  LoadingPill 
} from '../components/Skeleton';

export default function DevPage() {
  return (
    <div style={{ 
      padding: '40px', 
      maxWidth: '800px', 
      margin: '0 auto', 
      fontFamily: 'DM Sans, sans-serif' 
    }}>
      <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '32px', marginBottom: '32px' }}>
        EkoFare Component Lab — TICKET-002
      </h1>

      {/* 1. Base Skeleton */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--grey-500)', textTransform: 'uppercase', marginBottom: '16px' }}>
          1. Base Skeleton Blocks
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Skeleton width="100%" height={24} />
          <Skeleton width="60%" height={20} />
          <Skeleton width="120px" height={40} borderRadius="10px" />
        </div>
      </section>

      {/* 2. Route Card Skeleton */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--grey-500)', textTransform: 'uppercase', marginBottom: '16px' }}>
          2. Route Card Skeleton
        </h2>
        <RouteCardSkeleton />
        <RouteCardSkeleton />
      </section>

      {/* 3. Stop Row Skeleton */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--grey-500)', textTransform: 'uppercase', marginBottom: '16px' }}>
          3. Stop Row Skeleton (Timeline)
        </h2>
        <div style={{ paddingLeft: '20px' }}>
          <StopRowSkeleton />
          <StopRowSkeleton />
          <StopRowSkeleton />
        </div>
      </section>

      {/* 4. Loading Pill */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--grey-500)', textTransform: 'uppercase', marginBottom: '16px' }}>
          4. Loading Pill Overlay
        </h2>
        <div style={{ padding: '20px', background: 'var(--cream)', borderRadius: '14px', textAlign: 'center' }}>
          <LoadingPill />
        </div>
      </section>

      {/* 5. Dark Variant Test */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--grey-500)', textTransform: 'uppercase', marginBottom: '16px' }}>
          5. Dark Variant (For Green Header)
        </h2>
        <div style={{ 
          padding: '24px', 
          background: 'var(--green-800)', 
          borderRadius: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <Skeleton variant="dark" width="40%" height={28} />
          <div style={{ display: 'flex', gap: '8px' }}>
            <Skeleton variant="dark" width={80} height={24} borderRadius="20px" />
            <Skeleton variant="dark" width={80} height={24} borderRadius="20px" />
          </div>
        </div>
      </section>
    </div>
  );
}
