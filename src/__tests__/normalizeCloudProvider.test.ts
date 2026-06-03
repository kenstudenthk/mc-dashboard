import { describe, it, expect } from 'vitest';
import { normalizeCloudProvider } from '../services/emailTemplateService';

describe('normalizeCloudProvider', () => {
  it('normalizes AWS display name', () => {
    expect(normalizeCloudProvider('AWS (Amazon Web Service)')).toBe('AWS');
  });

  it('normalizes Microsoft Azure', () => {
    expect(normalizeCloudProvider('Microsoft Azure')).toBe('Azure');
  });

  it('normalizes Google Cloud Platform', () => {
    expect(normalizeCloudProvider('Google Cloud Platform (GCP)')).toBe('GCP');
  });

  it('returns raw string for unknown provider', () => {
    expect(normalizeCloudProvider('Unknown Provider')).toBe('Unknown Provider');
  });

  it('handles empty string', () => {
    expect(normalizeCloudProvider('')).toBe('');
  });
});
