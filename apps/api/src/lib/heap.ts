// ─────────────────────────────────────────────────────────────────────────────
// Binary min-heap (build spec §5.4 — Dijkstra's priority queue). Generic over a
// payload; ordered by a numeric priority. Kept tiny and dependency-free; the
// pathfinder is the only consumer. O(log n) push/pop.
// ─────────────────────────────────────────────────────────────────────────────

interface Node<T> {
  priority: number;
  value: T;
}

export class MinHeap<T> {
  private heap: Node<T>[] = [];

  get size(): number {
    return this.heap.length;
  }

  isEmpty(): boolean {
    return this.heap.length === 0;
  }

  push(value: T, priority: number): void {
    this.heap.push({ value, priority });
    this.bubbleUp(this.heap.length - 1);
  }

  /** Remove and return the lowest-priority value, or undefined if empty. */
  pop(): T | undefined {
    const top = this.heap[0];
    if (top === undefined) return undefined;
    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.bubbleDown(0);
    }
    return top.value;
  }

  private bubbleUp(i: number): void {
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.heap[i].priority >= this.heap[parent].priority) break;
      this.swap(i, parent);
      i = parent;
    }
  }

  private bubbleDown(i: number): void {
    const n = this.heap.length;
    for (;;) {
      const left = 2 * i + 1;
      const right = 2 * i + 2;
      let smallest = i;
      if (left < n && this.heap[left].priority < this.heap[smallest].priority) smallest = left;
      if (right < n && this.heap[right].priority < this.heap[smallest].priority) smallest = right;
      if (smallest === i) break;
      this.swap(i, smallest);
      i = smallest;
    }
  }

  private swap(a: number, b: number): void {
    const tmp = this.heap[a];
    this.heap[a] = this.heap[b];
    this.heap[b] = tmp;
  }
}
