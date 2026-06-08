import { describe, it, expect, vi, beforeEach } from 'vitest';
import { orderService } from '../services/orderService';

describe('orderService.update', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects a PA response that reports success but returns an empty/incomplete order', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: {} }),
    } as Response);

    await expect(
      orderService.update(123, { Title: 'Updated Title' }, 'user@example.com'),
    ).rejects.toThrow();
  });

  it('rejects a PA response with success:true and data:null', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: null }),
    } as Response);

    await expect(
      orderService.update(123, { Title: 'Updated Title' }, 'user@example.com'),
    ).rejects.toThrow();
  });

  it('returns the order when PA responds with a complete record', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: { ID: 123, Title: 'Updated Title', CustomerName: 'Acme', Status: 'Active' },
      }),
    } as Response);

    const result = await orderService.update(123, { Title: 'Updated Title' }, 'user@example.com');
    expect(result.id).toBe(123);
    expect(result.Title).toBe('Updated Title');
  });
});
