import { apiClient, USE_MOCKS, mockLatency } from './client';

export interface FlagInput {
  connection_id?: string | null;
  report_id?: string | null;
  reason: string;
}

export async function submitFlag(input: FlagInput): Promise<{ id: string, status: string }> {
  if (USE_MOCKS) {
    await mockLatency(300);
    return { id: 'flag_mock_123', status: 'open' };
  }

  const res = await apiClient.post<{ id: string, status: string }>('/flags', input);
  return res.data;
}
