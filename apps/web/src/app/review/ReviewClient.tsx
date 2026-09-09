'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getQueue, type QueueConnection } from '../../lib/api/routes';
import { submitFlag } from '../../lib/api/flags';
import { formatFare } from '../../lib/fare';
import { toast } from '../../store/useToast';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

import { useAuthStore } from '../../store/useAuthStore';
import { apiClient } from '../../lib/api/client';
import { isAxiosError } from 'axios';

export default function ReviewClient() {
  const queryClient = useQueryClient();
  const [actingOn, setActingOn] = useState<string | null>(null);
  const { role, token, login, logout } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['queue'],
    queryFn: getQueue,
    enabled: !!token,
  });

  const isMod = role === 'MODERATOR' || role === 'ADMIN';

  const verifyMutation = useMutation({
    mutationFn: async (conn: QueueConnection) => {
      return apiClient.post(`/routes/queue/${conn.id}/verify`);
    },
    onMutate: async (conn) => {
      setActingOn(conn.id);
      await queryClient.cancelQueries({ queryKey: ['queue'] });
      const previous = queryClient.getQueryData<{ queue: QueueConnection[] }>(['queue']);
      
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
      const previous = queryClient.getQueryData<{ queue: QueueConnection[] }>(['queue']);
      if (previous) {
        queryClient.setQueryData(['queue'], {
          queue: previous.queue.filter((c) => c.id !== conn.id),
        });
      }
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
      
      return { previous };
    },
    onError: (err, conn, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['queue'], context.previous);
      }
      setActingOn(null);
      toast.error('Failed to flag route');
    },
    onSuccess: (data, conn) => {
      const previous = queryClient.getQueryData<{ queue: QueueConnection[] }>(['queue']);
      if (previous) {
        queryClient.setQueryData(['queue'], {
          queue: previous.queue.filter((c) => c.id !== conn.id),
        });
      }
      toast.success('Flagged and removed from queue');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['queue'] });
      setActingOn(null);
    },
  });

  if (!isMod) {
    const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoginError('');
      try {
        const res = await apiClient.post('/admin/login', { email, password });
        login(res.data.token);
        toast.success('Logged in successfully');
      } catch (err) {
        if (isAxiosError(err)) {
          const data = err.response?.data as { message?: string } | undefined;
          setLoginError(data?.message || 'Login failed');
        } else {
          setLoginError('Login failed');
        }
      }
    };

    return (
      <div className="px-4 pt-[calc(16px+env(safe-area-inset-top))] animate-fade-in">
        <div className="flex h-[80vh] flex-col items-center justify-center text-center">
          <p className="text-[24px] font-bold text-cream font-[family-name:var(--font-disp)] mb-6">Moderator Login</p>
          <form onSubmit={handleLogin} className="flex flex-col gap-4 w-full max-w-[300px]">
            <input 
              type="email" 
              placeholder="Admin Email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-[48px] px-4 rounded-[12px] bg-ink-2 border border-line text-cream placeholder-muted focus:outline-none focus:border-yellow"
            />
            <input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-[48px] px-4 rounded-[12px] bg-ink-2 border border-line text-cream placeholder-muted focus:outline-none focus:border-yellow"
            />
            {loginError && <p className="text-stop text-[12px]">{loginError}</p>}
            <button type="submit" className="h-[48px] mt-2 rounded-[12px] bg-yellow text-ink font-bold transition-transform active:scale-95">
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

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
    <div className="px-4 pt-[calc(16px+env(safe-area-inset-top))] pb-28 animate-fade-in">
      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between rounded-card border border-yellow/30 bg-[rgba(255,206,58,0.08)] p-3 px-4">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-yellow text-ink">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </span>
            <span className="text-[13px] font-bold text-cream">Admin Access</span>
          </div>
          <button onClick={() => { logout(); toast.success('Logged out successfully'); }} className="text-[13px] text-stop font-bold px-3 py-1.5 rounded-full bg-stop/10 hover:bg-stop/20 transition-colors">
            Logout
          </button>
        </div>
      </div>
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

                <div className="flex gap-3 px-[14px] pb-[14px] pt-2 border-t border-line mt-3">
                  <button
                    type="button"
                    onClick={() => rejectMutation.mutate(conn)}
                    disabled={isActing}
                    className="flex-1 h-10 rounded-button text-[14px] font-bold flex items-center justify-center gap-2 bg-ink-3 text-stop transition-colors hover:bg-ink-4 disabled:opacity-50 disabled:pointer-events-none"
                    style={{ borderRadius: 'var(--radius-button)' }}
                  >
                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M7 1.4L12.6 12.6H1.4L7 1.4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M7 5.6V8.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="7" cy="10.8" r="0.9" fill="currentColor"/></svg>
                    {isDispute ? 'Reject' : 'Flag'}
                  </button>
                  <button
                    type="button"
                    onClick={() => verifyMutation.mutate(conn)}
                    disabled={isActing}
                    className="flex-1 h-10 rounded-button text-[14px] font-bold flex items-center justify-center gap-2 bg-yellow text-ink transition-opacity hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none"
                    style={{ borderRadius: 'var(--radius-button)' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.8 7.35L5.6 10.15L11.2 3.85" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    {isDispute ? 'Approve Spike' : 'Verify'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}


