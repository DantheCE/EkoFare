import { describe, it, expect } from 'vitest';
import { MinHeap } from './heap';

describe('MinHeap', () => {
  it('pops values in ascending priority order', () => {
    const h = new MinHeap<string>();
    h.push('c', 30);
    h.push('a', 10);
    h.push('b', 20);
    h.push('d', 40);
    expect([h.pop(), h.pop(), h.pop(), h.pop()]).toEqual(['a', 'b', 'c', 'd']);
  });

  it('reports empty and size correctly', () => {
    const h = new MinHeap<number>();
    expect(h.isEmpty()).toBe(true);
    expect(h.pop()).toBeUndefined();
    h.push(1, 5);
    h.push(2, 1);
    expect(h.size).toBe(2);
    expect(h.isEmpty()).toBe(false);
    expect(h.pop()).toBe(2);
    expect(h.size).toBe(1);
  });

  it('handles interleaved push and pop', () => {
    const h = new MinHeap<number>();
    h.push(5, 5);
    h.push(3, 3);
    expect(h.pop()).toBe(3);
    h.push(1, 1);
    h.push(4, 4);
    expect(h.pop()).toBe(1);
    expect(h.pop()).toBe(4);
    expect(h.pop()).toBe(5);
    expect(h.pop()).toBeUndefined();
  });

  it('keeps insertion stable enough to return every element exactly once', () => {
    const h = new MinHeap<number>();
    const priorities = [9, 2, 7, 2, 5, 2, 8, 1];
    priorities.forEach((p, i) => h.push(i, p));
    const out: number[] = [];
    while (!h.isEmpty()) out.push(h.pop()!);
    expect(out.length).toBe(priorities.length);
    expect(out.map((i) => priorities[i])).toEqual([...priorities].sort((a, b) => a - b));
  });
});
