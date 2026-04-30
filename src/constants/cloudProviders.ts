// src/constants/cloudProviders.ts

export const CANONICAL_PROVIDERS = [
  "AWS",
  "Alibaba",
  "Azure",
  "GCP",
  "Huawei",
  "Tencent",
] as const;

export type CanonicalProvider = typeof CANONICAL_PROVIDERS[number];

/** All known display-name aliases → canonical name */
const PROVIDER_ALIASES: Record<string, CanonicalProvider> = {
  // AWS
  "aws (amazon web service)": "AWS",
  "aws (amazon web services)": "AWS",
  "amazon web services": "AWS",
  "amazon web service": "AWS",
  "aws": "AWS",
  // Azure
  "microsoft azure": "Azure",
  "azure": "Azure",
  // GCP
  "google cloud platform (gcp)": "GCP",
  "google cloud platform": "GCP",
  "google cloud": "GCP",
  "gcp": "GCP",
  // Alibaba
  "alibaba cloud": "Alibaba",
  "alicloud": "Alibaba",
  "aliyun": "Alibaba",
  "alibaba": "Alibaba",
  // Huawei
  "huawei cloud ha": "Huawei",
  "huawei cloud": "Huawei",
  "huawei": "Huawei",
  // Tencent
  "tencent cloud": "Tencent",
  "tencent": "Tencent",
};

/**
 * Maps any known alias (case-insensitive) to its canonical name.
 * Returns the original string if no match found.
 */
export function normalizeCloudProvider(raw: string): string {
  if (!raw) return raw;
  return PROVIDER_ALIASES[raw.toLowerCase().trim()] ?? raw;
}

/** Options array for dropdowns — values match what SPO stores */
export const CLOUD_PROVIDER_OPTIONS = CANONICAL_PROVIDERS as unknown as string[];
