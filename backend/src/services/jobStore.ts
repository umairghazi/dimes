// In-memory job store for async AI classification jobs.
// Simple enough for single-instance use; swap backing store for Redis later if needed.

export interface JobState {
  status: "processing" | "done" | "failed";
  batchId: string;
  total: number;
  classified: number;
  aiAvailable: boolean;
  error?: string;
}

type Listener = (state: JobState) => void;

class JobStore {
  private jobs = new Map<string, JobState>();
  private listeners = new Map<string, Set<Listener>>();

  create(jobId: string, batchId: string, total: number): void {
    this.jobs.set(jobId, {
      status: "processing",
      batchId,
      total,
      classified: 0,
      aiAvailable: false,
    });
    this.listeners.set(jobId, new Set());
  }

  update(jobId: string, classified: number): void {
    const job = this.jobs.get(jobId);
    if (!job) return;
    job.classified = classified;
    this.emit(jobId);
  }

  complete(jobId: string, aiAvailable: boolean): void {
    const job = this.jobs.get(jobId);
    if (!job) return;
    job.status = "done";
    job.classified = job.total;
    job.aiAvailable = aiAvailable;
    this.emit(jobId);
    this.scheduleCleanup(jobId);
  }

  fail(jobId: string, error: string): void {
    const job = this.jobs.get(jobId);
    if (!job) return;
    job.status = "failed";
    job.error = error;
    this.emit(jobId);
    this.scheduleCleanup(jobId);
  }

  get(jobId: string): JobState | undefined {
    return this.jobs.get(jobId);
  }

  subscribe(jobId: string, listener: Listener): () => void {
    const set = this.listeners.get(jobId);
    if (!set) return () => {};
    set.add(listener);
    return () => set.delete(listener);
  }

  private emit(jobId: string): void {
    const job = this.jobs.get(jobId);
    const set = this.listeners.get(jobId);
    if (!job || !set) return;
    const snapshot = { ...job };
    for (const listener of set) listener(snapshot);
  }

  private scheduleCleanup(jobId: string): void {
    // Keep job state for 5 min so late-connecting clients can still get the result
    setTimeout(() => {
      this.jobs.delete(jobId);
      this.listeners.delete(jobId);
    }, 5 * 60 * 1000);
  }
}

export const jobStore = new JobStore();
