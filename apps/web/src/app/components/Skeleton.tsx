import React from 'react';

/**
 * 1. Base Skeleton Block
 * A generic shimmering rectangle with customizable dimensions.
 */
export const Skeleton = ({ 
  width, 
  height, 
  borderRadius = '4px', 
  className = '',
  variant = 'default' 
}: { 
  width?: string | number; 
  height?: string | number; 
  borderRadius?: string;
  className?: string;
  variant?: 'default' | 'dark';
}) => {
  const shimmerClass = variant === 'dark' ? 'skeleton-shimmer skeleton-shimmer-dark' : 'skeleton-shimmer';
  
  return (
    <div 
      className={`${shimmerClass} ${className}`}
      style={{ 
        width: width || '100%', 
        height: height || '20px', 
        borderRadius 
      }} 
    />
  );
};

/**
 * 2. RouteCardSkeleton
 * Matches the layout of a standard RouteCard:
 * [44x44 icon] [Two text bars] [Trailing pill]
 */
export const RouteCardSkeleton = () => (
  <div 
    style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '16px', 
      padding: '16px', 
      background: 'white', 
      borderRadius: '14px',
      border: '1px solid var(--grey-100)',
      marginBottom: '12px'
    }}
  >
    {/* 44x44 Icon tile */}
    <Skeleton width={44} height={44} borderRadius="10px" />
    
    {/* Content bars */}
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <Skeleton width="60%" height={18} />
      <Skeleton width="40%" height={14} />
    </div>
    
    {/* Trailing pill */}
    <Skeleton width={60} height={24} borderRadius="20px" />
  </div>
);

/**
 * 3. StopRowSkeleton
 * Used on the Route Detail timeline:
 * (Ring + Connector) [Text bar]
 */
export const StopRowSkeleton = () => (
  <div style={{ display: 'flex', gap: '16px', height: '60px' }}>
    {/* Timeline vertical elements */}
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ 
        width: '12px', 
        height: '12px', 
        borderRadius: '50%', 
        border: '2px solid var(--grey-300)',
        backgroundColor: 'white'
      }} />
      <div style={{ 
        flex: 1, 
        width: '2px', 
        backgroundColor: 'var(--grey-100)' 
      }} />
    </div>
    
    {/* Stop name placeholder */}
    <div style={{ paddingTop: '2px', flex: 1 }}>
      <Skeleton width="120px" height={16} />
    </div>
  </div>
);

/**
 * 4. LoadingPill
 * The premium overlay pill used during full-page transitions.
 */
export const LoadingPill = () => (
  <div 
    role="status" 
    aria-live="polite"
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '12px',
      padding: '4px 16px',
      background: 'white',
      borderRadius: '9999px',
      boxShadow: 'var(--shadow-card)',
      border: '1px solid var(--grey-100)'
    }}
  >
    {/* CSS-only Green Spinner */}
    <div style={{
      width: '16px',
      height: '16px',
      border: '2px solid var(--green-100)',
      borderTop: '2px solid var(--green-800)',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite'
    }} />
    
    <span style={{ 
      fontFamily: 'DM Sans', 
      fontSize: '14px', 
      fontWeight: 500, 
      color: 'var(--grey-700)' 
    }}>
      Loading route data...
    </span>

    {/* Inline style for the spinner keyframe */}
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);
