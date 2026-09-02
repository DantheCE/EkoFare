'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X, Clock } from 'lucide-react';
import { getQueue, type QueueConnection } from '../../lib/api/routes';
import { submitContribution } from '../../lib/api/contributions';
import { submitFlag } from '../../lib/api/flags';
import type { Vehicle } from '../../types';
import VehicleGlyph from '../components/VehicleGlyph';
import { formatFare } from '../../lib/fare';

export default function ReviewClient() {
  const queryClient = useQueryClient();
  const [actingOn, setActingOn] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['queue'],
    queryFn: getQueue,
  });

  const verifyMutation = useMutation({
    mutationFn: async (conn: QueueConnection) => {
      // Re-submit the leg as a contribution to bump consensus
      return submitContribution({
        submitted_name: `${conn.from_stop.name} to ${conn.to_stop.name}`,
        vehicle: conn.vehicle as Vehicle,
        stops: [
          { name: conn.from_stop.name, leg_fare: 0 },
          { name: conn.to_stop.name, leg_fare: conn.median_fare },
        ],
      }, { userConfirmed: true });
    },
    onMutate: async (conn) => {
      setActingOn(conn.id);
      await queryClient.cancelQueries({ queryKey: ['queue'] });
      const previous = queryClient.getQueryData<{ queue: QueueConnection[] }>(['queue']);
      
      if (previous) {
        queryClient.setQueryData(['queue'], {
          queue: previous.queue.filter((c) => c.id !== conn.id),
        });
      }
      return { previous };
    },
    onError: (err, conn, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['queue'], context.previous);
      }
      setActingOn(null);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['queue'] });
      setActingOn(null);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (conn: QueueConnection) => {
      return submitFlag({
        connection_id: conn.id,
        reason: 'Community rejection from Review Queue',
      });
    },
    onMutate: async (conn) => {
      setActingOn(conn.id);
      await queryClient.cancelQueries({ queryKey: ['queue'] });
      const previous = queryClient.getQueryData<{ queue: QueueConnection[] }>(['queue']);
      
      if (previous) {
        queryClient.setQueryData(['queue'], {
          queue: previous.queue.filter((c) => c.id !== conn.id),
        });
      }
      return { previous };
    },
    onError: (err, conn, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['queue'], context.previous);
      }
      setActingOn(null);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['queue'] });
      setActingOn(null);
    },
  });

  if (isLoading) {
    return <div className="text-[14px] text-muted font-bold tracking-widest uppercase mt-8 text-center">Loading Queue...</div>;
  }

  if (isError) {
    return (
      <div className="text-[14px] font-bold uppercase mt-8 text-center" style={{ color: 'var(--stop)' }}>
        Failed to load queue.
      </div>
    );
  }

  const queue = data?.queue || [];

  if (queue.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center p-12 text-center border border-line bg-ink-2 mt-8"
        style={{ borderRadius: 'var(--radius-card)' }}
      >
        <Check className="w-12 h-12 text-muted mb-4" />
        <h2 className="text-[20px] font-black uppercase text-cream">Queue is empty</h2>
        <p className="text-[14px] text-muted mt-2 font-medium">All submissions have been reviewed.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 mt-8">
      {queue.map((conn) => {
        const isActing = actingOn === conn.id;
        
        return (
          <div
            key={conn.id}
            className={`
              bg-ink-2 border border-line p-5 relative
              transition-opacity duration-300
              ${isActing ? 'opacity-50 pointer-events-none' : 'opacity-100'}
            `}
            style={{ borderRadius: 'var(--radius-card)' }}
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="flex items-center gap-2">
                <span
                  className="flex h-8 w-8 items-center justify-center border border-line bg-ink-3"
                  style={{ borderRadius: 'var(--radius-input)' }}
                >
                  <VehicleGlyph vehicle={conn.vehicle as Vehicle} />
                </span>
                <span className="text-[13px] font-bold text-cream uppercase tracking-wider">{conn.vehicle}</span>
              </span>
              <span className="text-muted text-[12px] font-bold uppercase tracking-widest flex items-center gap-1 ml-auto">
                <Clock className="w-3 h-3" />
                {conn.fare_reports} reports
              </span>
            </div>

            <div className="flex flex-col gap-1 mb-5">
              <div className="text-[16px] font-bold text-cream">{conn.from_stop.name}</div>
              <div className="text-muted font-black text-[12px] pl-1 uppercase tracking-widest">↓</div>
              <div className="text-[16px] font-bold text-cream">{conn.to_stop.name}</div>
            </div>
            
            <div className="text-[20px] font-extrabold text-yellow tnum mb-6">
              {formatFare(conn.median_fare)}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => verifyMutation.mutate(conn)}
                disabled={isActing}
                className="flex-1 bg-ink-3 hover:bg-ink-4 text-cream font-bold text-[14px] uppercase tracking-widest h-11 flex items-center justify-center gap-2 transition-colors border border-line"
                style={{ borderRadius: 'var(--radius-button)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--yellow)';
                  e.currentTarget.style.color = 'var(--yellow)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--line)';
                  e.currentTarget.style.color = 'var(--cream)';
                }}
              >
                <Check className="w-4 h-4" />
                Verify
              </button>
              <button
                type="button"
                onClick={() => rejectMutation.mutate(conn)}
                disabled={isActing}
                className="flex-1 bg-ink-3 text-muted font-bold text-[14px] uppercase tracking-widest h-11 flex items-center justify-center gap-2 transition-colors border border-line"
                style={{ borderRadius: 'var(--radius-button)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--stop)';
                  e.currentTarget.style.color = 'var(--stop)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--line)';
                  e.currentTarget.style.color = 'var(--muted)';
                }}
              >
                <X className="w-4 h-4" />
                Flag
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
