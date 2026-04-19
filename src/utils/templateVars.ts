import { Order } from "../services/orderService";
import { ServiceAccount } from "../services/serviceAccountService";

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
  };

  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return key in vars ? vars[key] : match;
  });
}

export function getUnresolvedVars(
  template: string,
  order: Order,
  serviceAccount?: ServiceAccount | null,
): string[] {
  const resolved = resolveTemplate(template, order, serviceAccount);
  const remaining = resolved.matchAll(/\{\{(\w+)\}\}/g);
  return [...new Set([...remaining].map((m) => m[1]))];
}
