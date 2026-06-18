import { describe, it, expect } from 'vitest';
import { dijkstra, type Adjacency, type GraphEdge } from './pathfind';

function edge(to: string, fare: number, duration = 10): GraphEdge {
  return { to, vehicle: 'DANFO', fare, duration, reports: 5, status: 'VERIFIED', last_verified: '2026-01-01T00:00:00.000Z' };
}

function graph(spec: Record<string, GraphEdge[]>): Adjacency {
  return new Map(Object.entries(spec));
}

describe('dijkstra', () => {
  it('finds a direct edge', () => {
    const g = graph({ A: [edge('B', 100)] });
    const r = dijkstra(g, 'A', 'B');
    expect(r?.stops).toEqual(['A', 'B']);
    expect(r?.total_fare).toBe(100);
  });

  it('stitches a multi-hop path no single edge spans', () => {
    // A→C direct does not exist; A→B→C is the only way (the transfer case).
    const g = graph({ A: [edge('B', 50)], B: [edge('C', 70)] });
    const r = dijkstra(g, 'A', 'C');
    expect(r?.stops).toEqual(['A', 'B', 'C']);
    expect(r?.total_fare).toBe(120);
    expect(r?.total_duration).toBe(20);
    expect(r?.edges).toHaveLength(2);
  });

  it('prefers the cheaper of two paths', () => {
    // A→B→D = 100+100=200; A→C→D = 60+60=120 (cheaper despite same hop count).
    const g = graph({
      A: [edge('B', 100), edge('C', 60)],
      B: [edge('D', 100)],
      C: [edge('D', 60)],
    });
    const r = dijkstra(g, 'A', 'D');
    expect(r?.stops).toEqual(['A', 'C', 'D']);
    expect(r?.total_fare).toBe(120);
  });

  it('breaks fare ties by fewer hops', () => {
    // Two equal-fare routes A→D: direct-ish A→B→D (200) vs A→C→E→D (200).
    const g = graph({
      A: [edge('B', 100), edge('C', 50)],
      B: [edge('D', 100)],
      C: [edge('E', 50)],
      E: [edge('D', 100)],
    });
    const r = dijkstra(g, 'A', 'D');
    expect(r?.total_fare).toBe(200);
    expect(r?.stops).toEqual(['A', 'B', 'D']); // 2 hops beats 3
  });

  it('returns null when no path exists', () => {
    const g = graph({ A: [edge('B', 100)], C: [edge('D', 100)] });
    expect(dijkstra(g, 'A', 'D')).toBeNull();
  });

  it('returns a trivial path for from === to', () => {
    const g = graph({ A: [edge('B', 100)] });
    const r = dijkstra(g, 'A', 'A');
    expect(r).toEqual({ stops: ['A'], edges: [], total_fare: 0, total_duration: 0 });
  });

  it('handles a directed graph (no reverse edge)', () => {
    const g = graph({ A: [edge('B', 100)] }); // B has no edge back to A
    expect(dijkstra(g, 'B', 'A')).toBeNull();
  });
});
