import { CanonicalProvider } from "./cloudProviders";

export interface ServiceProviderTheme {
  id: string;
  provider: CanonicalProvider;
  displayName: string;
  shortName: string;
  headline: string;
  description: string;
  primary: string;
  secondary: string;
  surface: string;
  logoContrast: string;
  logoUrl: string;
  headerLogoUrl?: string;
  accountLabel: string;
  loginLabel: string;
  billingLabel: string;
}

export const serviceProviders: ServiceProviderTheme[] = [
  {
    id: "aws",
    provider: "AWS",
    displayName: "AWS",
    shortName: "AWS",
    headline: "Amazon Web Services Accounts",
    description:
      "Track AWS account IDs, login emails, billing mapping, and linked order activity.",
    primary: "#232f3e",
    secondary: "#ff9900",
    surface: "#fff7ed",
    logoContrast: "#ff9900",
    logoUrl: "/provider-logos/aws-color.svg",
    headerLogoUrl: "/provider-logos/aws-color-white.svg",
    accountLabel: "AWS Account ID",
    loginLabel: "Root/Login Email",
    billingLabel: "Payer/Billing Account",
  },
  {
    id: "azure",
    provider: "Azure",
    displayName: "Microsoft Azure",
    shortName: "Azure",
    headline: "Microsoft Azure Subscriptions",
    description:
      "Review Azure account and subscription information with billing and order references.",
    primary: "#0078d4",
    secondary: "#50e6ff",
    surface: "#eff6ff",
    logoContrast: "#ffffff",
    logoUrl: "/provider-logos/azure-color.svg",
    accountLabel: "Subscription / Account ID",
    loginLabel: "Tenant/Login Email",
    billingLabel: "Billing Account",
  },
  {
    id: "gcp",
    provider: "GCP",
    displayName: "Google Cloud",
    shortName: "GCP",
    headline: "Google Cloud Projects",
    description:
      "View Google Cloud service account records, project references, and support order links.",
    primary: "#1a73e8",
    secondary: "#34a853",
    surface: "#f1f8ff",
    logoContrast: "#ffffff",
    logoUrl: "/provider-logos/googlecloud-color.svg",
    accountLabel: "Project / Account ID",
    loginLabel: "Admin/Login Email",
    billingLabel: "Billing Account",
  },
  {
    id: "huawei",
    provider: "Huawei",
    displayName: "Huawei Cloud",
    shortName: "Huawei",
    headline: "Huawei Cloud Accounts",
    description:
      "Manage Huawei Cloud account references, customer ownership, and order handoff details.",
    primary: "#cf0a2c",
    secondary: "#111111",
    surface: "#fff1f2",
    logoContrast: "#ffffff",
    logoUrl: "/provider-logos/huawei-color.svg",
    accountLabel: "Huawei Account ID",
    loginLabel: "Login Email",
    billingLabel: "Primary Billing ID",
  },
  {
    id: "alibaba",
    provider: "Alibaba",
    displayName: "Alibaba Cloud",
    shortName: "Alibaba",
    headline: "Alibaba Cloud Accounts",
    description:
      "Inspect Alibaba Cloud account IDs, service types, billing accounts, and linked orders.",
    primary: "#ff6a00",
    secondary: "#111111",
    surface: "#fff7ed",
    logoContrast: "#111111",
    logoUrl: "/provider-logos/alibabacloud-color.svg",
    accountLabel: "Alibaba Account ID",
    loginLabel: "Login Email",
    billingLabel: "Billing Account",
  },
  {
    id: "tencent",
    provider: "Tencent",
    displayName: "Tencent Cloud",
    shortName: "Tencent",
    headline: "Tencent Cloud Accounts",
    description:
      "See Tencent Cloud account data, service status, request numbers, and order links.",
    primary: "#006eff",
    secondary: "#00c6ff",
    surface: "#eff6ff",
    logoContrast: "#ffffff",
    logoUrl: "/provider-logos/tencentcloud-color.svg",
    accountLabel: "Tencent Account ID",
    loginLabel: "Login Email",
    billingLabel: "Billing Account",
  },
];

export function findServiceProvider(idOrProvider?: string): ServiceProviderTheme | undefined {
  if (!idOrProvider) return undefined;
  const key = idOrProvider.toLowerCase().trim();
  return serviceProviders.find(
    (provider) =>
      provider.id === key || provider.provider.toLowerCase() === key,
  );
}
