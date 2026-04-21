import { Order } from "../services/orderService";
import { ServiceAccount } from "../services/serviceAccountService";

export const SERVICE_ACCOUNT_ID_LABELS: Record<string, string> = {
  AWS: "AWS ID",
  Alibaba: "UID",
  Huawei: "Account ID",
  GCP: "Account ID",
  Azure: "Microsoft ID",
  General: "Account ID",
};

export const SERVICE_EXTRA_ID_LABELS: Record<string, Array<{ key: string; label: string }>> = {
  Azure: [{ key: "AzureSubscriptionID", label: "Azure Subscription ID" }],
};

export const TENANT_ID_LABEL = "Tenant ID (TID)";

export function getAccountIDLabel(serviceType: string): string {
  return SERVICE_ACCOUNT_ID_LABELS[serviceType] ?? "Account ID";
}

const formatDate = (iso: string): string => {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const day = String(d.getDate()).padStart(2, "0");
    const month = d.toLocaleString("en-GB", { month: "short" });
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch {
    return iso;
  }
};

const formatCurrency = (amount: number): string =>
  `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

export function resolveTemplate(
  template: string,
  order: Order,
  serviceAccount?: ServiceAccount | null,
  manualVars?: Record<string, string>,
): string {
  const vars: Record<string, string> = {
    CustomerName: order.CustomerName ?? "",
    OrderTitle: order.Title ?? "",
    SubName: order.SubName ?? "",
    ServiceType: order.ServiceType ?? "",
    CloudProvider: order.CloudProvider ?? "",
    ContactPerson: order.ContactPerson ?? "",
    ContactEmail: order.ContactEmail ?? "",
    SRD: order.SRD ? formatDate(order.SRD) : "",
    Amount:
      order.Amount != null && Number.isFinite(order.Amount)
        ? formatCurrency(order.Amount)
        : "",
    OasisNumber: order.OasisNumber ?? "",
    AccountName: serviceAccount?.AccountName ?? "",
    BillingAddress: order.BillingAddress ?? "",
    // SP text columns return "" for unset — use || so empty string falls through
    AccountID: serviceAccount?.PrimaryAccountID || order.AccountID || "",
    LoginEmail: serviceAccount?.LoginEmail || order.AccountLoginEmail || "",
    TenantID: order.TID ?? "",
    AMEmail: "",
    ASMEmail: "",
    AdminEmail: "",
    ServiceNumber: "",
    ServiceDeskNo: order.SDNumber ?? "",
    InvitationURL: "",
    MicrosoftID: "",
    AzureSubscriptionID: "",
    // Manual vars override auto-resolved values when provided
    ...manualVars,
  };

  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return key in vars ? vars[key] : match;
  });
}

export function getUnresolvedVars(
  template: string,
  order: Order,
  serviceAccount?: ServiceAccount | null,
  manualVars?: Record<string, string>,
): string[] {
  const resolved = resolveTemplate(template, order, serviceAccount, manualVars);
  const remaining = resolved.matchAll(/\{\{(\w+)\}\}/g);
  return [...new Set([...remaining].map((m) => m[1]))];
}
