import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sleep } from './sleep';

describe('sleep', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should resolve after the specified time', async () => {
    const promise = sleep(1000);
    
    // Fast-forward time
    vi.advanceTimersByTime(1000);
    
    await expect(promise).resolves.toBeUndefined();
  });

  it('should not resolve before the specified time', async () => {
    const promise = sleep(1000);
    const resolved = { value: false };
    
    promise.then(() => { resolved.value = true; });
    
    // Advance less than the sleep time
    vi.advanceTimersByTime(500);
    
    // Allow microtask queue to process
    await Promise.resolve();
    
    expect(resolved.value).toBe(false);
  });

  it('should handle zero milliseconds', async () => {
    const promise = sleep(0);
    
    vi.advanceTimersByTime(0);
    
    await expect(promise).resolves.toBeUndefined();
  });

  it('should reject immediately if signal is already aborted', async () => {
    const controller = new AbortController();
    controller.abort();
    
    await expect(sleep(1000, { signal: controller.signal }))
      .rejects.toThrow('Sleep aborted');
  });

  it('should reject when signal is aborted during sleep', async () => {
    const controller = new AbortController();
    const promise = sleep(1000, { signal: controller.signal });
    
    // Abort after some time
    vi.advanceTimersByTime(500);
    controller.abort();
    
    await expect(promise).rejects.toThrow('Sleep aborted');
  });

  it('should resolve normally when signal is not aborted', async () => {
    const controller = new AbortController();
    const promise = sleep(1000, { signal: controller.signal });
    
    vi.advanceTimersByTime(1000);
    
    await expect(promise).resolves.toBeUndefined();
  });

  it('should handle sleep without abort signal', async () => {
    const promise = sleep(500);
    
    vi.advanceTimersByTime(500);
    
    await expect(promise).resolves.toBeUndefined();
  });
});