'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getQueue, type QueueConnection } from '../../lib/api/routes';
import { submitContribution } from '../../lib/api/contributions';
import { submitFlag } from '../../lib/api/flags';
import type { Vehicle } from '../../types';
import { formatFare } from '../../lib/fare';
import { toast } from '../../store/useToast';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

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
      toast.error('Failed to verify route');
    },
    onSuccess: (data, conn) => {
      toast.success(`${conn.from_stop.name} \u2192 ${conn.to_stop.name} verified at ${formatFare(conn.median_fare)}`);
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
      toast.error('Failed to flag route');
    },
    onSuccess: () => {
      toast.success('Flagged and removed from queue');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['queue'] });
      setActingOn(null);
    },
  });

  if (isLoading) {
    return <div className="text-[14px] text-muted font-bold tracking-widest uppercase mt-12 text-center">Loading Queue...</div>;
  }

  if (isError) {
    return (
      <div className="text-[14px] font-bold uppercase mt-12 text-center text-stop">
        Failed to load queue.
      </div>
    );
  }

  const queue = data?.queue || [];

  return (
    <>
      <header className="flex items-end justify-between pb-[26px] mb-[14px] border-b border-[#211E14]">
        <div>
          <div className="font-[family-name:var(--font-body)] font-bold text-[11px] tracking-[0.18em] text-yellow uppercase mb-3 flex items-center gap-[10px] before:content-[''] before:w-[26px] before:h-[2px] before:bg-yellow">Moderation</div>
          <div className="font-[family-name:var(--font-disp)] text-[56px] font-normal text-cream leading-none">Review</div>
        </div>
      </header>

      <div className="flex items-baseline justify-between mb-6">
        <h2 className="text-[13px] font-bold text-muted uppercase tracking-[0.15em]">Pending Approvals</h2>
        <div className="text-[13px] font-bold text-yellow font-[tnum]">{queue.length}</div>
      </div>

      <div className="flex flex-col gap-4">
        {queue.length === 0 ? (
          <div className="mt-[64px]">
            <div className="w-[64px] h-[64px] border-2 border-dashed border-[rgba(70,224,140,.3)] rounded-full mx-auto mb-5 flex items-center justify-center text-go">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            </div>
            <h3 className="font-[family-name:var(--font-disp)] text-[32px] text-cream text-center mb-3 leading-none">All Caught Up</h3>
            <p className="text-[14px] text-muted text-center leading-[1.5]">The community queue is clear.<br/>Thanks for keeping EkoFare accurate.</p>
            <div className="text-center">
              <Link href="/search" className="mt-6 inline-flex items-center justify-center h-[48px] px-6 bg-yellow text-ink font-bold text-[14px] rounded-full transition-transform active:scale-95">Go to Search</Link>
            </div>
            <p className="text-[11px] text-faint text-center mt-4">New routes will appear here for verification.</p>
          </div>
        ) : (
          queue.map((conn) => {
            const isActing = actingOn === conn.id;
            
            // Is it a fare dispute? We don't have this field directly, but we can assume if reports > 0, it's an existing route getting updated.
            const isDispute = conn.fare_reports > 0;
            
            return (
              <div
                key={conn.id}
                className={`
                  bg-ink-2 border rounded-[24px] relative overflow-hidden transition-colors duration-200
                  ${isDispute ? 'border-stop before:bg-stop' : 'border-line before:bg-yellow'}
                  before:content-[''] before:absolute before:top-0 before:left-0 before:bottom-0 before:w-1
                  ${isActing ? 'opacity-50 pointer-events-none' : 'opacity-100'}
                `}
              >
                <div className="p-[20px_24px_16px] flex justify-between items-start gap-4">
                  <div>
                    <div className="text-[19px] font-bold text-cream tracking-[-0.01em] leading-[1.25]">
                      {conn.from_stop.name} &rarr; {conn.to_stop.name}
                    </div>
                    <div className="flex items-center gap-[6px] mt-[6px] flex-wrap">
                      <span className="text-[9px] font-extrabold tracking-[0.05em] px-[6px] py-[4px] rounded bg-ink-3 text-yellow uppercase">{conn.vehicle}</span>
                      {isDispute ? (
                        <span className="text-[9px] font-extrabold tracking-[0.05em] px-[6px] py-[4px] rounded bg-[rgba(255,122,69,.1)] text-stop uppercase">Fare Dispute</span>
                      ) : (
                        <span className="text-[9px] font-extrabold tracking-[0.05em] px-[6px] py-[4px] rounded bg-ink-3 text-muted uppercase">New Route</span>
                      )}
                      <span className="text-[10px] text-faint">
                        {conn.last_verified ? formatDistanceToNow(new Date(conn.last_verified), { addSuffix: true, includeSeconds: true }).replace('about ', '') : ''}
                      </span>
                    </div>
                  </div>
                  <div className="font-[family-name:var(--font-body)] font-extrabold font-[tnum] text-[22px] text-go leading-none shrink-0">
                    {formatFare(conn.median_fare)}
                  </div>
                </div>

                <div className="px-6 pb-3 flex flex-col gap-0">
                  <div className="flex items-center gap-2 py-1">
                    <div className="w-[6px] h-[6px] rounded-full shrink-0 bg-go"></div>
                    <div className="text-[12.5px] text-cream font-semibold flex-1 whitespace-nowrap overflow-hidden text-ellipsis">{conn.from_stop.name}</div>
                  </div>
                  <div className="flex items-center gap-2 py-1">
                    <div className="w-[6px] h-[6px] rounded-full shrink-0 bg-stop"></div>
                    <div className="text-[12.5px] text-cream font-semibold flex-1 whitespace-nowrap overflow-hidden text-ellipsis">{conn.to_stop.name}</div>
                  </div>
                  {isDispute && (
                    <div className="text-[11px] text-faint pl-[14px] mt-[2px]">Verify new fare reported</div>
                  )}
                </div>

                <div className="mx-[14px] mb-[14px] px-3 py-[10px] bg-ink-3 rounded-[10px]">
                  <div className="flex justify-between items-center mb-[6px]">
                    <span className="text-[11px] text-muted font-medium"><b className="text-cream font-bold">{conn.fare_reports} of 3</b> reports needed</span>
                  </div>
                  <div className="flex gap-[2px] h-[6px]">
                    <div className="flex-1 rounded-[3px] bg-go"></div>
                    <div className={`flex-1 rounded-[3px] ${conn.fare_reports > 1 ? 'bg-go' : 'bg-line'}`}></div>
                    <div className={`flex-1 rounded-[3px] ${conn.fare_reports > 2 ? 'bg-go' : 'bg-line'}`}></div>
                  </div>
                </div>

                <div className="flex border-t border-line">
                  <button
                    type="button"
                    onClick={() => verifyMutation.mutate(conn)}
                    disabled={isActing}
                    className="flex-1 p-[14px] text-center font-[family-name:var(--font-body)] text-[13px] font-bold flex items-center justify-center gap-[6px] bg-transparent border-none cursor-pointer transition-colors hover:bg-ink-3 disabled:opacity-50 disabled:pointer-events-none text-go border-r border-line"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.8 7.35L5.6 10.15L11.2 3.85" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    {isDispute ? 'Approve Spike' : 'Verify'}
                  </button>
                  <button
                    type="button"
                    onClick={() => rejectMutation.mutate(conn)}
                    disabled={isActing}
                    className="flex-1 p-[14px] text-center font-[family-name:var(--font-body)] text-[13px] font-bold flex items-center justify-center gap-[6px] bg-transparent border-none cursor-pointer transition-colors hover:bg-ink-3 disabled:opacity-50 disabled:pointer-events-none text-stop"
                  >
                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M7 1.4L12.6 12.6H1.4L7 1.4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M7 5.6V8.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="7" cy="10.8" r="0.9" fill="currentColor"/></svg>
                    {isDispute ? 'Reject' : 'Flag'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
