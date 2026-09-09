import { apiClient } from './client';

export interface FlagInput {
  connection_id?: string | null;
  report_id?: string | null;
  reason: string;
}

export async function submitFlag(input: FlagInput): Promise<{ id: string, status: string }> {
  const res = await apiClient.post<{ id: string, status: string }>('/flags', input);
  return res.data;
}
