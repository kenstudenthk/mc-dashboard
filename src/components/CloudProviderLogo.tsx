import React from 'react';

interface SVGProps { size: number }

const AwsIcon = ({ size }: SVGProps) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="40" height="40" rx="8" fill="#232F3E" />
    <text x="20" y="23" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold" fontFamily="Arial, sans-serif">aws</text>
    <path d="M9 31 C14 35.5 26 35.5 31 31" stroke="#FF9900" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    <path d="M29 28.5 L32.5 31 L29 33.5" fill="none" stroke="#FF9900" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const AzureIcon = ({ size }: SVGProps) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="40" height="40" rx="8" fill="white" />
    {/* Front face - bright blue */}
    <path d="M20 5 L7 31 L16 31 L22 17 Z" fill="#0078D4" />
    {/* Right face - layered fold */}
    <path d="M22 17 L28 31 L33 31 L24 13 Z" fill="#0078D4" opacity="0.75" />
    {/* Bottom bar */}
    <path d="M7 31 L33 31 L28 36 L12 36 Z" fill="#0058A3" />
  </svg>
);

const GcpIcon = ({ size }: SVGProps) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="40" height="40" rx="8" fill="white" />
    {/* Cloud silhouette */}
    <path d="M10 28 Q10 22 16 22 Q17 15 23 16 Q28 13 30 19 Q36 19 36 25 Q36 28 32 28 Z" fill="#E8F0FE" />
    {/* Google 4-color dots */}
    <circle cx="15" cy="25" r="2.8" fill="#4285F4" />
    <circle cx="21" cy="25" r="2.8" fill="#EA4335" />
    <circle cx="27" cy="25" r="2.8" fill="#FBBC05" />
    <circle cx="33" cy="25" r="2.8" fill="#34A853" />
    {/* connecting line */}
    <line x1="15" y1="25" x2="33" y2="25" stroke="#DADCE0" strokeWidth="1" />
  </svg>
);

const HuaweiIcon = ({ size }: SVGProps) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="40" height="40" rx="8" fill="#CF0A2C" />
    {/* 8-petal flower centered at 20,20 */}
    <g transform="translate(20,20)">
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
        <ellipse
          key={angle}
          cx="0"
          cy="-8.5"
          rx="2.8"
          ry="6"
          fill="white"
          transform={`rotate(${angle})`}
          opacity={angle % 90 === 0 ? 1 : 0.85}
        />
      ))}
    </g>
  </svg>
);

const AlibabaIcon = ({ size }: SVGProps) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="40" height="40" rx="8" fill="#FF6A00" />
    {/* Stylized cloud / wave shape representing Aliyun */}
    <path
      d="M11 26 Q11 20 17 20 Q16 15 21 15 Q26 12 28 17 Q33 17 33 22 Q33 26 29 26 Z"
      fill="white"
      opacity="0.95"
    />
    {/* "A" hint inside cloud */}
    <path d="M18 24 L21 18 L24 24" stroke="#FF6A00" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="19.2" y1="22" x2="22.8" y2="22" stroke="#FF6A00" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const TencentIcon = ({ size }: SVGProps) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="40" height="40" rx="8" fill="#006EFF" />
    {/* Cloud body */}
    <path
      d="M10 27 Q10 21 16 21 Q15 15 21 15 Q26 12 28.5 17 Q34 17 34 23 Q34 27 30 27 Z"
      fill="white"
      opacity="0.95"
    />
    {/* Rain dots — Tencent Cloud style */}
    <circle cx="16" cy="31" r="1.8" fill="white" opacity="0.8" />
    <circle cx="21" cy="32.5" r="1.8" fill="white" opacity="0.8" />
    <circle cx="26" cy="31" r="1.8" fill="white" opacity="0.8" />
  </svg>
);

// Map all known provider name variants → normalized key
const PROVIDER_KEY: Record<string, string> = {
  'aws (amazon web service)': 'aws',
  'amazon web services': 'aws',
  'aws': 'aws',
  'microsoft azure': 'azure',
  'azure': 'azure',
  'google cloud platform (gcp)': 'gcp',
  'google cloud platform': 'gcp',
  'google cloud': 'gcp',
  'gcp': 'gcp',
  'huawei cloud': 'huawei',
  'huawei cloud ha': 'huawei',
  'huawei': 'huawei',
  'alicloud': 'alibaba',
  'alibaba cloud': 'alibaba',
  'alibaba': 'alibaba',
  'aliyun': 'alibaba',
  'tencent cloud': 'tencent',
  'tencent': 'tencent',
};

const PROVIDER_DISPLAY: Record<string, string> = {
  aws: 'AWS',
  azure: 'Microsoft Azure',
  gcp: 'Google Cloud',
  huawei: 'Huawei Cloud',
  alibaba: 'Alibaba Cloud',
  tencent: 'Tencent Cloud',
};

const ICONS: Record<string, React.FC<SVGProps>> = {
  aws: AwsIcon,
  azure: AzureIcon,
  gcp: GcpIcon,
  huawei: HuaweiIcon,
  alibaba: AlibabaIcon,
  tencent: TencentIcon,
};

interface CloudProviderLogoProps {
  provider: string;
  size?: number;
  showName?: boolean;
  nameClassName?: string;
  className?: string;
}

export function CloudProviderLogo({
  provider,
  size = 28,
  showName = true,
  nameClassName = 'text-sm font-medium text-gray-700',
  className = '',
}: CloudProviderLogoProps) {
  const key = PROVIDER_KEY[provider.toLowerCase()] ?? '';
  const Icon = ICONS[key];
  const displayName = PROVIDER_DISPLAY[key] ?? provider;

  if (!Icon) {
    return (
      <span className={`inline-flex items-center gap-2 ${className}`}>
        <span
          className="inline-flex items-center justify-center rounded-md bg-gray-200 text-gray-500 text-[10px] font-bold"
          style={{ width: size, height: size }}
        >
          ?
        </span>
        {showName && <span className={nameClassName}>{provider}</span>}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Icon size={size} />
      {showName && <span className={nameClassName}>{displayName}</span>}
    </span>
  );
}

export { PROVIDER_KEY, PROVIDER_DISPLAY };
export default CloudProviderLogo;
