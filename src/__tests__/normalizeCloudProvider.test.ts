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

  // Regression: issue #64 — internal/double whitespace in SharePoint display
  // names must still normalize to the canonical key.
  it('collapses internal double spaces before matching', () => {
    expect(normalizeCloudProvider('AWS  (Amazon Web Service)')).toBe('AWS');
  });

  it('collapses mixed internal whitespace (tabs/newlines) before matching', () => {
    expect(normalizeCloudProvider('Google\tCloud   Platform (GCP)')).toBe('GCP');
  });

  // On a miss, the ORIGINAL raw string is returned untouched — not the
  // whitespace-collapsed lookup key.
  it('returns the raw (uncollapsed) string when an internally-spaced name does not match', () => {
    expect(normalizeCloudProvider('Some  Unknown   Provider')).toBe('Some  Unknown   Provider');
  });
});
