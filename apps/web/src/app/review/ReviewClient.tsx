'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X, Car, Clock } from 'lucide-react';
import { getQueue, type QueueConnection } from '../../lib/api/routes';
import { submitContribution } from '../../lib/api/contributions';
import { submitFlag } from '../../lib/api/flags';
import type { Vehicle } from '../../types';

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
    return <div className="text-zinc-500 font-bold tracking-widest uppercase">Loading Queue...</div>;
  }

  if (isError) {
    return <div className="text-red-500 font-bold uppercase">Failed to load queue.</div>;
  }

  const queue = data?.queue || [];

  if (queue.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-zinc-800 rounded-3xl mt-12 bg-zinc-900/50">
        <Check className="w-16 h-16 text-zinc-600 mb-6" />
        <h2 className="text-2xl font-black uppercase text-zinc-400">Queue is empty</h2>
        <p className="text-zinc-500 mt-2 font-medium">All submissions have been reviewed.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {queue.map((conn) => {
        const isActing = actingOn === conn.id;
        
        return (
          <div
            key={conn.id}
            className={`
              bg-zinc-900 border-2 border-zinc-800 rounded-3xl p-6 overflow-hidden relative
              transition-opacity duration-300
              ${isActing ? 'opacity-50 pointer-events-none' : 'opacity-100'}
            `}
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="px-3 py-1 bg-yellow-400 text-black text-xs font-black uppercase tracking-wider rounded-full flex items-center gap-1">
                <Car className="w-3 h-3" />
                {conn.vehicle}
              </span>
              <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {conn.fare_reports} reports
              </span>
            </div>

            <div className="flex flex-col gap-1 mb-6">
              <div className="text-xl font-bold">{conn.from_stop.name}</div>
              <div className="text-zinc-500 font-black text-sm pl-2 uppercase tracking-widest">↓</div>
              <div className="text-xl font-bold">{conn.to_stop.name}</div>
            </div>
            
            <div className="text-3xl font-black text-yellow-400 mb-6">
              ₦{conn.median_fare}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => verifyMutation.mutate(conn)}
                disabled={isActing}
                className="flex-1 bg-zinc-800 hover:bg-yellow-400 hover:text-black text-white font-black uppercase tracking-widest py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors border-2 border-zinc-700 hover:border-yellow-400"
              >
                <Check className="w-5 h-5" />
                Verify
              </button>
              <button
                onClick={() => rejectMutation.mutate(conn)}
                disabled={isActing}
                className="flex-1 bg-zinc-800 hover:bg-red-500 hover:text-white text-zinc-400 font-black uppercase tracking-widest py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors border-2 border-zinc-700 hover:border-red-500"
              >
                <X className="w-5 h-5" />
                Flag
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
